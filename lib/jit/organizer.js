/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import postcss from "postcss";
import { applyBreakpoints } from "./breakpoints.js";

export const organizeStyles = (
  inventory,
  themeAST,
  activeComponents,
  activeUtilities,
  breakpoints,
  activeKeyframes = [],
) => {
  return {
    postcssPlugin: "frontalign-organizer",
    Once(root) {
      const layerBase = postcss.atRule({ name: "layer", params: "base" });
      inventory.base.forEach((item) => layerBase.append(item.node.clone()));
      activeKeyframes.forEach((item) => layerBase.append(item.node.clone()));

      const layerComp = postcss.atRule({ name: "layer", params: "components" });
      activeComponents.forEach((item) => layerComp.append(item.node.clone()));

      const layerUtil = postcss.atRule({ name: "layer", params: "utilities" });
      activeUtilities.forEach((item) => layerUtil.append(item.node.clone()));

      let layerCustom = null;
      if (themeAST.customRules && themeAST.customRules.length > 0) {
        layerCustom = postcss.atRule({ name: "layer", params: "custom" });
        themeAST.customRules.forEach((n) => layerCustom.append(n.clone()));
      }

      // AST üzerinden birbaşa variable axtarışı (Regex və ToString əvəzinə)
      const usedVars = new Set();
      const varRegex = /var\(\s*(--[^),\s]+)/g;

      const scanDeclsForVars = (container) => {
        container.walkDecls((decl) => {
          let match;
          while ((match = varRegex.exec(decl.value)) !== null) {
            usedVars.add(match[1].trim());
          }
        });
      };

      scanDeclsForVars(layerBase);
      scanDeclsForVars(layerComp);
      scanDeclsForVars(layerUtil);
      if (layerCustom) scanDeclsForVars(layerCustom);

      const allRootDecls = [];
      const allDarkDecls = [];
      const varDeps = new Map();

      function extractDeps(decl, map) {
        if (!decl.prop.startsWith("--")) return;

        if (!map.has(decl.prop)) {
          map.set(decl.prop, []);
        }
        const deps = map.get(decl.prop);

        let match;
        while ((match = varRegex.exec(decl.value)) !== null) {
          const depName = match[1].trim();
          if (!deps.includes(depName)) {
            deps.push(depName);
          }
        }
      }

      [
        ...inventory.theme.map((i) => i.node),
        themeAST.rootBlock,
        themeAST.darkBlock,
      ].forEach((rule) => {
        if (rule.selector === ":root") {
          rule.walkDecls((d) => {
            allRootDecls.push(d);
            extractDeps(d, varDeps);
          });
        } else if (
          rule.selector &&
          rule.selector.includes('[fa-theme="dark"]')
        ) {
          rule.walkDecls((d) => {
            allDarkDecls.push(d);
            extractDeps(d, varDeps);
          });
        }
      });

      let changed = true;
      while (changed) {
        changed = false;
        for (const v of Array.from(usedVars)) {
          if (varDeps.has(v)) {
            for (const dep of varDeps.get(v)) {
              if (!usedVars.has(dep)) {
                usedVars.add(dep);
                changed = true;
              }
            }
          }
        }
      }

      const finalRootMap = new Map();
      allRootDecls.forEach((d) => {
        if (usedVars.has(d.prop)) finalRootMap.set(d.prop, d.value);
      });

      const finalDarkMap = new Map();
      allDarkDecls.forEach((d) => {
        if (usedVars.has(d.prop)) finalDarkMap.set(d.prop, d.value);
      });

      const themeLayer = postcss.atRule({ name: "layer", params: "theme" });
      if (finalRootMap.size > 0) {
        const r = postcss.rule({ selector: ":root" });
        finalRootMap.forEach((v, p) => r.append({ prop: p, value: v }));
        themeLayer.append(r);
      }
      if (finalDarkMap.size > 0) {
        const r = postcss.rule({ selector: '[fa-theme="dark"]' });
        finalDarkMap.forEach((v, p) => r.append({ prop: p, value: v }));
        themeLayer.append(r);
      }

      root.removeAll();
      if (themeAST.importRule) root.append(themeAST.importRule);
      const layerNames = layerCustom
        ? "theme, base, components, utilities, custom"
        : "theme, base, components, utilities";

      root.append(postcss.atRule({ name: "layer", params: layerNames }));
      root.append(themeLayer);
      root.append(layerBase);
      root.append(layerComp);
      root.append(layerUtil);
      if (layerCustom) {
        root.append(layerCustom);
      }
      if (breakpoints) {
        applyBreakpoints(root, breakpoints);
      }
    },
  };
};
