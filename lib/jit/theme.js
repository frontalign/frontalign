/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
import postcss from "postcss";
import { resolveBreakpoints } from "./breakpoints.js";

export function buildThemeAST(config) {
  const rootBlock = postcss.rule({ selector: ":root" });
  const darkBlock = postcss.rule({ selector: '[fa-theme="dark"]' });
  const customRules = [];
  let importRule = null;
  const breakpoints = resolveBreakpoints(config);
  Object.entries(breakpoints).forEach(([alias, value]) => {
    rootBlock.append({ prop: `--breakpoint-${alias}`, value });
  });

  if (config.fonts?.length > 0) {
    const query = config.fonts
      .map(
        (f) =>
          `family=${f.family.replace(/ /g, "+")}${f.weights ? `:wght@${f.weights}` : ""}`,
      )
      .join("&");
    importRule = postcss.atRule({
      name: "import",
      params: `url('https://fonts.googleapis.com/css2?${query}&display=swap')`,
    });

    config.fonts.forEach((f) => {
      const slug = f.alias || f.family.toLowerCase().replace(/\s+/g, "-");
      const category = f.category || "sans-serif";
      const rule = postcss.rule({ selector: `.font-${slug}` });
      rule.append({
        prop: "font-family",
        value: `'${f.family}', ${category}`,
      });
      customRules.push(rule);
    });
  }

  const themeMap = {
    body: "--body",
    bodyText: "--body-text",
    primary: "--primary",
    primaryContrast: "--primary-contrast",
    font: "--font",
    fontMono: "--font-monospace",
    spaceXs: "--space-xs",
    spaceSm: "--space-sm",
    spaceMd: "--space-md",
    spaceLg: "--space-lg",
    spaceXl: "--space-xl",
    space2xl: "--space-2xl",
  };
  if (config.theme) {
    Object.entries(themeMap).forEach(([key, varName]) => {
      if (config.theme[key])
        rootBlock.append({ prop: varName, value: config.theme[key] });
    });
    if (config.theme.extend) {
      Object.entries(config.theme.extend).forEach(([k, v]) => {
        rootBlock.append({ prop: k.startsWith("--") ? k : `--${k}`, value: v });
      });
    }
    if (config.theme.dark) {
      Object.entries(themeMap).forEach(([key, varName]) => {
        if (config.theme.dark[key])
          darkBlock.append({ prop: varName, value: config.theme.dark[key] });
      });
      if (config.theme.dark.extend) {
        Object.entries(config.theme.dark.extend).forEach(([k, v]) => {
          darkBlock.append({
            prop: k.startsWith("--") ? k : `--${k}`,
            value: v,
          });
        });
      }
    }
  }

  if (config.classes) {
    Object.entries(config.classes).forEach(([selector, decls]) => {
      const rule = postcss.rule({ selector: `.${selector}` });
      if (typeof decls === "string") {
        rule.append(decls);
      } else {
        const { dark, ...light } = decls;
        Object.entries(light).forEach(([p, v]) =>
          rule.append({ prop: p, value: v }),
        );
        if (dark) {
          const dRule = postcss.rule({
            selector: `[fa-theme="dark"] .${selector}`,
          });
          Object.entries(dark).forEach(([p, v]) =>
            dRule.append({ prop: p, value: v }),
          );
          customRules.push(dRule);
        }
      }
      customRules.push(rule);
    });
  }

  return { importRule, rootBlock, darkBlock, customRules };
}
