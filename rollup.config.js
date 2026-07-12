import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import { DEFAULT_BREAKPOINTS } from "./lib/jit/constants.js";
import { applyBreakpoints } from "./lib/jit/breakpoints.js";

const cdnBreakpointsPlugin = () => {
  return {
    postcssPlugin: "frontalign-cdn-breakpoints",

    Once(root) {
      applyBreakpoints(root, DEFAULT_BREAKPOINTS);
    },
  };
};
cdnBreakpointsPlugin.postcss = true;

export default [
  // ─────────────────────────────────────────
  // ESM — Bundler (Vite, Webpack, Rollup)
  // ─────────────────────────────────────────
  {
    input: "src/js/index.js",
    output: {
      file: "dist/js/frontalign.esm.js",
      format: "es",
      sourcemap: true,
    },
  },

  // ─────────────────────────────────────────
  // ESM — React Adapter
  // ─────────────────────────────────────────
  {
    input: "src/react/index.js",
    external: ["react"],
    output: {
      file: "dist/react/frontalign-react.esm.js",
      format: "es",
      sourcemap: true,
    },
  },

  // ─────────────────────────────────────────
  // UMD — CDN
  // Minified
  // ─────────────────────────────────────────
  {
    input: "src/js/index.umd.js",
    output: {
      file: "dist/js/frontalign.min.js",
      format: "umd",
      name: "FrontAlign",
      sourcemap: true,
      plugins: [terser()],
    },
  },

  // CSS — Processed, NOT minified
  {
    input: "src/css/frontalign.css",
    output: {
      dir: "dist/css",
    },
    plugins: [
      postcss({
        extract: "frontalign.css",
        minimize: false,
        plugins: [
          postcssPresetEnv({
            stage: false,
          }),
        ],
      }),
    ],
  },

  // CSS — Minified
  {
    input: "src/css/frontalign.css",
    output: {
      dir: "dist/css",
    },
    plugins: [
      postcss({
        extract: "frontalign.min.css",
        minimize: false,
        plugins: [
          cdnBreakpointsPlugin(),
          postcssPresetEnv({
            stage: false,
          }),
          cssnano({
            preset: ["default", { calc: false }],
          }),
        ],
      }),
    ],
  },
];
