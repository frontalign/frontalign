/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import path from "path";

export const ROOT = process.cwd();
export const CONFIG_PATH = path.join(ROOT, "frontalign.config.js");
export const OUTPUT_PATH = path.join(ROOT, "public", "frontalign.build.css");
export const MAIN_CSS = path.join(
  ROOT,
  "node_modules",
  "frontalign",
  "dist",
  "css",
  "frontalign.css",
);
export const CACHE_DIR = path.join(
  ROOT,
  "node_modules",
  ".cache",
  "frontalign",
);
export const CACHE_FILE = path.join(CACHE_DIR, "cache.json");

export const SOURCE_EXTENSIONS = ["js", "jsx", "ts", "tsx"];
export const WATCH_EXTENSIONS = ["js", "jsx", "ts", "tsx"];
export const IGNORE_PATTERNS = ["**/node_modules/**", "**/.git/**"];

export const DEFAULT_BREAKPOINTS = {
  sm: "640px",
  md: "864px",
  lg: "1120px",
  xl: "1408px",
  "2xl": "1792px",
};
export function resolveExtensions(config, baseExtensions) {
  const extra = config?.jit?.extensions || [];
  return [...new Set([...baseExtensions, ...extra])];
}
// Normalize the path for all os
export const normalizePath = (p) => p.split(path.sep).join("/");
