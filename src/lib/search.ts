import { CARS } from "@/data/cars.generated";

/** Fold Turkish letters and accents to ASCII so "megane" finds "Mégane" and
 *  "skoda" finds "Škoda". Mirrors scripts/lib/slug.mjs, which cannot be shared
 *  across the script/app boundary (plain .mjs vs. TypeScript with path aliases). */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Built once for all 3858 models rather than per keystroke.
const SEARCH_INDEX: Map<string, string> = new Map(
  CARS.map((c) => [c.slug, normalize(`${c.brand} ${c.model}`)])
);

/** Every whitespace-separated term must appear, so "vw golf" and "golf vw"
 *  both work. */
export function matchesQuery(slug: string, query: string): boolean {
  if (!query) return true;
  const haystack = SEARCH_INDEX.get(slug);
  if (!haystack) return false;
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}
