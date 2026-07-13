/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { createHash } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { CACHE_DIR, CACHE_FILE } from "./constants.js";

export async function loadCache() {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { files: {}, classes: [] };
  }
}

export async function saveCache(cache) {
  await mkdir(CACHE_DIR, { recursive: true });
  const tmpFile = `${CACHE_FILE}.${process.pid}.tmp`;
  await writeFile(tmpFile, JSON.stringify(cache, null, 2), "utf8");
  await rename(tmpFile, CACHE_FILE);
}

export async function fileHash(filePath) {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}
