// Reads the hand-maintained catalogue out of src/data/cars.ts.
//
// cars.ts imports from "@/lib/types", so Node can't import it directly — and
// keeping it as plain TS is deliberate: it is the human-edited source of model
// identity and of the curated Turkish-market ordering. The scripts enrich it,
// they never rewrite it.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./slug.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..", "..");
export const DATA_DIR = path.join(ROOT, "scripts", "data");

const ROW = /\{\s*brand:\s*"((?:[^"\\]|\\.)*)"\s*,\s*model:\s*"((?:[^"\\]|\\.)*)"\s*,\s*segment:\s*"([a-z]+)"\s*\}/g;

/** @returns {Promise<Array<{brand:string, model:string, segment:string, slug:string, index:number}>>} */
export async function readCatalog() {
  const source = await readFile(path.join(ROOT, "src", "data", "cars.ts"), "utf8");
  const body = source.slice(source.indexOf("const RAW_CARS"));
  const cars = [];
  for (const m of body.matchAll(ROW)) {
    const brand = m[1];
    const model = m[2];
    cars.push({ brand, model, segment: m[3], slug: slugify(brand, model), index: cars.length });
  }
  return cars;
}

/** `--limit 800` → only the first 800 entries, which is the curated head. */
export function applyLimit(cars, argv = process.argv) {
  const i = argv.indexOf("--limit");
  if (i === -1) return cars;
  const n = Number(argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? cars.slice(0, n) : cars;
}

export function hasFlag(flag, argv = process.argv) {
  return argv.includes(flag);
}
