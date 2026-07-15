/*!
 * FrontAlign v1.0.4
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { DEFAULT_BREAKPOINTS } from "./constants.js";

/**
 * Merges user-defined breakpoints (from fa.config.js) with the
 * framework defaults, so every alias (sm, md, lg, xl, 2xl) always
 * resolves to a concrete value.
 */
export function resolveBreakpoints(config) {
  const overrides = config?.theme?.breakpoints || config?.breakpoints || {};

  return { ...DEFAULT_BREAKPOINTS, ...overrides };
}

export function applyBreakpoints(root, breakpoints) {
  const varRe = /var\(--breakpoint-(sm|md|lg|xl|2xl)\)/g;

  root.walkAtRules("media", (atrule) => {
    let changed = false;

    const newParams = atrule.params.replace(varRe, (match, alias) => {
      const override = breakpoints[alias];
      if (override) {
        changed = true;
        return override;
      }
      return match;
    });

    if (changed) {
      atrule.params = newParams;
    }
  });
}
