#!/usr/bin/env node

/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
async function bootstrap() {
  try {
    const { runCli } = await import("../lib/fa-cli.js");
    await runCli();
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND") {
      const missingModule = err.message.match(/'([^']+)'/)?.[1] || "";

      console.log("\n❌ FrontAlign JIT Compiler is not working.");
      console.log(
        "Please install bellow packages to your project.\n",
      );
      console.log(
        "\x1b[36m%s\x1b[0m",
        "npm install -D postcss cssnano chokidar glob\n",
      );

      process.exit(1);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}
bootstrap();
