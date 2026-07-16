#!/usr/bin/env node

/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const REQUIRED_JIT_DEPS = ["postcss", "cssnano", "glob", "chokidar"];

function detectPackageManager() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

// Confirms the chosen package manager's executable actually resolves on
// this machine. `shell: true` lets Windows find npm.cmd/yarn.cmd/pnpm.cmd
// without us having to know the exact extension ourselves.
function commandExists(cmd) {
  const probe =
    process.platform === "win32" ? ["where", [cmd]] : ["command", ["-v", cmd]];

  const result = spawnSync(probe[0], probe[1], {
    shell: true,
    stdio: "ignore",
  });
  return result.status === 0;
}

function resolvePackageManager() {
  const preferred = detectPackageManager();
  if (commandExists(preferred)) return preferred;

  // Lock file pointed at a manager that isn't actually installed —
  // fall back to npm, which ships with Node itself.
  if (preferred !== "npm" && commandExists("npm")) return "npm";

  return null;
}

function installCommand(pm, deps) {
  if (pm === "pnpm") return ["pnpm", ["add", "-D", ...deps]];
  if (pm === "yarn") return ["yarn", ["add", "-D", ...deps]];
  return ["npm", ["install", "-D", ...deps]];
}

function printManualInstallInstructions(pm, deps) {
  const cmd = pm || "npm";
  const addWord = cmd === "npm" ? "install" : "add";
  console.log(
    "\n❌ FrontAlign: Please install the required packages manually:\n",
  );
  console.log(`   ${cmd} ${addWord} -D ${deps.join(" ")}\n`);
}

// Node's ESM loader caches a failed dynamic import() for a given
// specifier — even after the file appears on disk moments later, a
// retry in the SAME process returns the old failure. The only reliable
// fix is to install, then re-exec this CLI in a brand new Node process
// so module resolution starts clean.
function reExecInFreshProcess() {
  const result = spawnSync(
    process.execPath,
    [__filename, ...process.argv.slice(2)],
    {
      stdio: "inherit",
      shell: false,
    },
  );
  process.exit(result.status ?? 1);
}

function extractMissingPackageName(message) {
  // Node's "Cannot find package 'X' imported from ..." — bare specifier.
  const bareMatch = message.match(/Cannot find package '([^']+)'/);
  if (bareMatch) return bareMatch[1];

  // Fallback: any quoted token; strip it down to a plausible package name
  // in case Node reports a resolved file path instead of the specifier.
  const anyMatch = message.match(/'([^']+)'/)?.[1] || "";
  return anyMatch;
}

async function installMissingDeps(missingModule) {
  const deps = missingModule ? [missingModule] : REQUIRED_JIT_DEPS;
  const pm = resolvePackageManager();

  if (!pm) {
    console.log(
      "\n❌ FrontAlign: No package manager (npm/yarn/pnpm) could be found on this system.",
    );
    printManualInstallInstructions("npm", deps);
    process.exit(1);
  }

  console.log(
    `\n📦 FrontAlign: Installing missing JIT package(s) with ${pm}: ${deps.join(", ")}\n`,
  );

  const [cmd, args] = installCommand(pm, deps);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });

  if (result.error || result.status !== 0) {
    console.log(`\n❌ FrontAlign: Automatic install with ${pm} failed.`);
    printManualInstallInstructions(pm, deps);
    process.exit(1);
  }

  console.log(
    "\n✓ FrontAlign: Packages installed successfully. Restarting...\n",
  );
}

async function bootstrap() {
  try {
    const { runCli } = await import("../lib/fa-cli.js");
    await runCli();
  } catch (err) {
    if (err.code !== "ERR_MODULE_NOT_FOUND") {
      console.error("\n❌ FrontAlign: Unexpected error:");
      console.error(err?.stack || err?.message || err);
      process.exit(1);
    }

    const missingModule = extractMissingPackageName(err.message);
    await installMissingDeps(missingModule);

    // Re-exec in a fresh process instead of retrying import() here —
    // avoids Node's ESM negative-resolution cache entirely.
    reExecInFreshProcess();
  }
}

bootstrap();
