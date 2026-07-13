/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import fs from "fs";
import path from "path";
import { readFile, mkdir } from "fs/promises";
import { pathToFileURL } from "url";
import postcss from "postcss";
import cssnano from "cssnano";
import { CONFIG_PATH, MAIN_CSS, OUTPUT_PATH } from "./constants.js";
import { parseCSSInventory } from "./parser.js";
import { buildThemeAST } from "./theme.js";
import { scanProject } from "./scanner.js";
import { loadCache, saveCache } from "./cache.js";
import { organizeStyles } from "./organizer.js";
import { extractRequiredClasses, splitSelectorList } from "./selector.js";
import { resolveBreakpoints } from "./breakpoints.js";

let cachedInventory = null;
let cachedConfig = null;

/*
 * A class counts as "used" for component-layer purge decisions if either:
 * - it's an exact match in usedClasses, or
 * - it's a hyphenated sub-part of a class that IS directly used, e.g.
 * safelisted (or scanned) root class pull in every CSS sub-part of that
 * component, even ones only ever set dynamically via JS (classList,
 * innerHTML, setAttribute, etc.) that no static scanner could ever see.
 * Intentionally NOT applied to the utility layer: utilities are atomic and
 * independent, so this same fallback there would let "flex" being used
 * silently keep "flex-1", "flex-wrap", etc. regardless of whether they're
 * actually used — breaking utility purging almost entirely.
 */
function isClassSatisfied(cls, usedClasses) {
  if (usedClasses.has(cls)) return true;

  for (const used of usedClasses) {
    if (cls.startsWith(`${used}-`)) return true;
  }
  return false;
}

function shouldIncludeNode(selector, usedClasses, isComponent = false) {
  if (!selector) return true;

  const parts = splitSelectorList(selector);

  return parts.some((part) => {
    // Classes that only appear inside :not()/:has()/:is()/:where() are
    // conditions on the element, not requirements — e.g. the "is-active"
    // in ".foo:not(.is-active)" must never gate inclusion of the rule.
    const reqClasses = extractRequiredClasses(part);

    // If there are no classes (body, h1, ::selection, etc.), always include
    if (reqClasses.length === 0) return true;

    if (isComponent) {
      return reqClasses.every((cls) => isClassSatisfied(cls, usedClasses));
    }

    // UTILITY LAYER — strict, exact match only. See isClassSatisfied's
    // comment for why the family fallback must not apply here.
    return reqClasses.every((cls) => usedClasses.has(cls));
  });
}

export async function runCompiler({ command } = {}) {
  const t0 = performance.now();
  let config;

  try {
    if (!cachedConfig) {
      const configUrl = pathToFileURL(CONFIG_PATH).href;
      const configModule = await import(`${configUrl}?update=${Date.now()}`);
      cachedConfig = configModule.default || configModule;
    }
    config = cachedConfig;
  } catch (err) {
    console.error(
      `\n❌ FrontAlign: Config file not found or it is corrupted (${CONFIG_PATH})`,
    );
    console.error(`   Detail: ${err.message}`);
    return;
  }

  try {
    if (!cachedInventory) {
      let rawCss;
      try {
        rawCss = await readFile(MAIN_CSS, "utf8");
      } catch (err) {
        console.error(
          `\n❌ FrontAlign: frontalign.css file not found in node_modules.`,
        );
        console.error(`   The path: ${MAIN_CSS}`);
        return;
      }

      try {
        cachedInventory = await parseCSSInventory(rawCss);
      } catch (err) {
        console.error(
          `\n❌ FrontAlign: frontalign.css could not be parsed — it may contain invalid CSS syntax.`,
        );
        console.error(`   The path: ${MAIN_CSS}`);
        console.error(`   Detail: ${err.message}`);
        return;
      }
    }

    const cache = await loadCache();
    const { allClasses, updatedCache } = await scanProject(config, cache);
    await saveCache(updatedCache);

    const themeAST = buildThemeAST(config);

    const breakpoints = resolveBreakpoints(config);

    const activeComponents = cachedInventory.components.filter((item) =>
      shouldIncludeNode(item.selector, allClasses, true),
    );

    const activeUtilities = cachedInventory.utilities.filter((item) =>
      shouldIncludeNode(item.selector, allClasses, false),
    );

    const usedAnimationNames = collectAnimationNames([
      ...cachedInventory.base,
      ...activeComponents,
      ...activeUtilities,
    ]);

    const activeKeyframes = cachedInventory.keyframes.filter((item) =>
      usedAnimationNames.has(item.name),
    );

    const uniqueComps = deduplicateItems(activeComponents);
    const uniqueUtils = deduplicateItems(activeUtilities);

    const plugins = [
      organizeStyles(
        cachedInventory,
        themeAST,
        uniqueComps,
        uniqueUtils,
        breakpoints,
        activeKeyframes,
      ),
    ];

    if (command === "build") {
      plugins.push(cssnano({ preset: ["default", { mergeRules: false }] }));
    }

    // PostCSS
    const result = await postcss(plugins).process(postcss.root(), {
      from: undefined,
    });

    // Make the file
    await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, result.css);

    console.log(
      `✓ FrontAlign: JIT compiled ${uniqueComps.length + uniqueUtils.length} rules in ${(performance.now() - t0).toFixed(1)}ms. Active classes: ${allClasses.size}`,
    );
  } catch (err) {
    console.error("\n❌ FrontAlign Compiler Error:");
    console.error(err.message || err);

    // If the error comes from postcss or its plugin
    if (err.plugin) {
      console.error(`   Plugin: ${err.plugin}`);
    }
  }
}

function deduplicateItems(items) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const sig = item.node.toString();
    if (!seen.has(sig)) {
      seen.add(sig);
      result.push(item);
    }
  });
  return result;
}

const ANIMATION_PROP_RE = /^animation(-name)?$/;
function collectAnimationNames(items) {
  const names = new Set();

  items.forEach((item) => {
    item.node.walkDecls((decl) => {
      if (!ANIMATION_PROP_RE.test(decl.prop)) return;

      splitSelectorList(decl.value).forEach((chunk) => {
        chunk
          .trim()
          .split(/\s+/)
          .forEach((token) => {
            if (!token.includes("(")) names.add(token);
          });
      });
    });
  });

  return names;
}

export function resetCompilerCache() {
  cachedInventory = null;
}

export function resetConfigCache() {
  cachedConfig = null;
}
