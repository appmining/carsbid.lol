// Tiny JSON cache so every scraper is resumable: a run that dies (or that you
// interrupt) picks up where it left off instead of re-requesting everything.

import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./catalog.mjs";

export async function loadStore(name) {
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, name), "utf8"));
  } catch {
    return {};
  }
}

/** Write via a temp file + rename so an interrupted save can't truncate the cache. */
export async function saveStore(name, data) {
  await mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, name);
  const tmp = `${target}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, target);
}
