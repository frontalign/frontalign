/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import chokidar from "chokidar";
import { resetCompilerCache, resetConfigCache } from "./compiler.js";
import { createScanPatterns } from "./scanner.js";
import {
  CACHE_FILE,
  CONFIG_PATH,
  MAIN_CSS,
  ROOT,
  normalizePath,
} from "./constants.js";

function getScanTargets(config) {
  const scanPatterns = config?.jit?.scan || [];
  if (scanPatterns.length === 0) return [];

  const dirs = scanPatterns.map((p) => {
    const clean = normalizePath(p).replace(/^\/+/, "").replace(/\/+$/, "");
    const base = clean.split(/[*{]/)[0].replace(/\/+$/, "");
    return base || ".";
  });

  return [...new Set(dirs)];
}

async function loadConfigSafely() {
  try {
    const configUrl = pathToFileURL(CONFIG_PATH).href;
    const m = await import(`${configUrl}?update=${Date.now()}`);
    return m.default || m;
  } catch (err) {
    console.error("⚠️ FrontAlign: Config file error:", err.message);
    return null;
  }
}
export async function startWatcher({
  onChange,
  onMainCssChange,
  debounceMs = 100,
} = {}) {
  let currentConfig = await loadConfigSafely();

  const staticTargets = [normalizePath(CONFIG_PATH), normalizePath(MAIN_CSS)];

  const scanTargets = getScanTargets(currentConfig);

  const watcher = chokidar.watch([...staticTargets, ...scanTargets], {
    persistent: true,
    ignored: ["**/node_modules/**", "**/.cache/**", "**/.git/**"],
    awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 50 },
    ignoreInitial: true,
  });

  // --- Rebuild scheduling: debounce + single-flight ---
  let debounceTimer = null;
  let rebuildInFlight = false;
  let rebuildPending = false;

  function scheduleRebuild() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runRebuild, debounceMs);
  }

  async function runRebuild() {
    debounceTimer = null;

    if (rebuildInFlight) {
      rebuildPending = true;
      return;
    }

    rebuildInFlight = true;
    try {
      await onChange?.();
    } catch (err) {
      console.error("\n❌ FrontAlign: Rebuild failed:");
      console.error(err?.message || err);
    } finally {
      rebuildInFlight = false;
      if (rebuildPending) {
        rebuildPending = false;
        scheduleRebuild();
      }
    }
  }

  const handleFsEvent = async (eventType, filePath) => {
    const rel = path.relative(ROOT, filePath);
    console.log(`🔄 Change detected in [${rel}], updating CSS...`);

    if (normalizePath(filePath) === normalizePath(CONFIG_PATH)) {
      const newConfig = await loadConfigSafely();
      if (!newConfig) return;

      const oldScanTargets = getScanTargets(currentConfig);
      const newScanTargets = getScanTargets(newConfig);

      if (oldScanTargets.length > 0) {
        watcher.unwatch(oldScanTargets);
      }

      if (newScanTargets.length > 0) {
        watcher.add(newScanTargets);
      }
      currentConfig = newConfig;
      resetConfigCache();
    }

    if (normalizePath(filePath) === normalizePath(MAIN_CSS)) {
      resetCompilerCache();
      onMainCssChange?.();
      try {
        await fs.promises.unlink(CACHE_FILE);
      } catch {}
    }

    scheduleRebuild();
  };
  function safeHandleFsEvent(eventType, filePath) {
    handleFsEvent(eventType, filePath).catch((err) => {
      console.error("\n❌ FrontAlign: Watcher event handling failed:");
      console.error(err?.message || err);
    });
  }

  watcher
    .on("add", (filePath) => safeHandleFsEvent("add", filePath))
    .on("change", (filePath) => safeHandleFsEvent("change", filePath))
    .on("unlink", (filePath) => safeHandleFsEvent("unlink", filePath));
  return watcher;
}
