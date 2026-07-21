/*!
 * FrontAlign v1.0.6
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { runCompiler, resetCompilerCache } from "./jit/compiler.js";
import { startWatcher } from "./jit/watcher.js";

export async function runCli(command = process.argv[2]) {
  if (command === "build") {
    await runCompiler({ command });
    return;
  }

  if (command === "dev") {
    console.log(
      "👀 FrontAlign: Watch mode is active. Listening for changes...",
    );
    await runCompiler({ command });
    await startWatcher({
      onChange: async () => runCompiler({ command }),
      onMainCssChange: resetCompilerCache,
    });
    return;
  }

  console.log(`
  FrontAlign CLI Tools
  
  Usage:
    frontalign build    Production CSS build (minified & fully optimized)
    frontalign dev      Development Watch mode (hot reloading, ultra-fast)
    `);
}
