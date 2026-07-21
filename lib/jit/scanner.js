/*!
 * FrontAlign v1.0.6
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import path from "path";
import { readFile, stat, realpath } from "fs/promises";
import { glob } from "glob";
import {
  IGNORE_PATTERNS,
  ROOT,
  SOURCE_EXTENSIONS,
  normalizePath,
  resolveExtensions,
} from "./constants.js";
import { fileHash } from "./cache.js";
import {
  extractClassesFromContent,
  extractVarsFromContent,
} from "./extractor.js";

const DEFAULT_SCAN_CONCURRENCY = 50;

export function createScanPatterns(
  scanPatterns,
  extensions = SOURCE_EXTENSIONS,
) {
  return scanPatterns.map((p) => {
    const clean = normalizePath(p).replace(/^\/+/, "").replace(/\/+$/, "");

    if (clean.includes("*")) return clean;

    const extRe = new RegExp(`\\.(${extensions.join("|")})$`);
    if (extRe.test(clean)) return clean;

    return `${clean}/**/*.{${extensions.join(",")}}`;
  });
}

export async function hasValidScanFiles(config) {
  const scanPatterns = config.jit?.scan || [];
  if (scanPatterns.length === 0) return false;

  const extensions = resolveExtensions(config, SOURCE_EXTENSIONS);
  const patterns = createScanPatterns(scanPatterns, extensions);
  const foundFiles = await glob(patterns, {
    cwd: ROOT,
    ignore: IGNORE_PATTERNS,
    absolute: true,
  });

  return foundFiles.length > 0;
}

// Runs `worker` over `items` with at most `limit` tasks in flight at once,
// instead of firing every file read/stat/hash in parallel via Promise.all.
// A finished task immediately picks up the next item, so throughput stays
// high without ever opening thousands of file handles at the same time.
async function mapWithConcurrency(items, limit, worker) {
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, runNext));
}

export async function scanProject(config, cache) {
  const scanPatterns = config.jit?.scan || [];
  const safelist = config.jit?.safelist || [];
  const debug = config.jit?.debug === true;
  const concurrency = config.jit?.concurrency || DEFAULT_SCAN_CONCURRENCY;

  const allClasses = new Set([...safelist]);
  const allVars = new Set();
  const updatedFiles = { ...(cache.files || {}) };

  if (scanPatterns.length === 0) {
    return {
      allClasses,
      allVars,
      updatedCache: { files: updatedFiles, classes: [...allClasses] },
    };
  }

  const extensions = resolveExtensions(config, SOURCE_EXTENSIONS);
  const patterns = createScanPatterns(scanPatterns, extensions);

  const normalizedRoot = normalizePath(ROOT);

  const filePaths = await glob(patterns, {
    cwd: normalizedRoot,
    ignore: IGNORE_PATTERNS,
    absolute: true,
  });

  const currentRelPaths = new Set();

  await mapWithConcurrency(filePaths, concurrency, async (absPath) => {
    let realAbsPath;
    try {
      realAbsPath = await realpath(absPath);
    } catch {
      if (debug) {
        console.warn(
          `⚠️ FrontAlign: Could not resolve path for [${absPath}]. Skipping...`,
        );
      }
      return;
    }
    const relPath = normalizePath(path.relative(ROOT, realAbsPath));
    currentRelPaths.add(relPath);

    let mtime;
    try {
      mtime = (await stat(absPath)).mtimeMs;
    } catch {
      if (debug) {
        console.warn(
          `⚠️ FrontAlign: Could not read file stats for [${relPath}]. Skipping...`,
        );
      }
      return;
    }

    const cached = updatedFiles[relPath];

    if (cached && cached.mtime === mtime) {
      (cached.classes || []).forEach((c) => allClasses.add(c));
      (cached.vars || []).forEach((v) => allVars.add(v));
      return;
    }

    let hash;
    try {
      hash = await fileHash(absPath);
    } catch {
      if (debug) {
        console.warn(
          `⚠️ FrontAlign: Could not generate hash for [${relPath}]. Skipping...`,
        );
      }
      return;
    }

    if (cached && cached.hash === hash) {
      updatedFiles[relPath] = { ...cached, mtime };
      (cached.classes || []).forEach((c) => allClasses.add(c));
      (cached.vars || []).forEach((v) => allVars.add(v));
      return;
    }

    let content;
    try {
      content = await readFile(absPath, "utf8");
    } catch {
      if (debug) {
        console.warn(
          `⚠️ FrontAlign: Could not read content of [${relPath}]. Skipping...`,
        );
      }
      return;
    }

    const fileClasses = extractClassesFromContent(content);
    const fileVars = extractVarsFromContent(content);

    fileClasses.forEach((c) => allClasses.add(c));
    fileVars.forEach((v) => allVars.add(v));

    updatedFiles[relPath] = {
      mtime,
      hash,
      classes: [...fileClasses],
      vars: [...fileVars],
    };
  });

  for (const relPath in updatedFiles) {
    if (!currentRelPaths.has(relPath)) delete updatedFiles[relPath];
  }

  return {
    allClasses,
    allVars,
    updatedCache: { files: updatedFiles, classes: [...allClasses] },
  };
}
