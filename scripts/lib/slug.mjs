// Shared slug helper. This used to be duplicated verbatim in
// scripts/fetch-car-images.mjs and src/data/cars.ts — if the two ever drifted,
// CAR_IMAGES lookups would silently miss and every card would fall back to the
// placeholder with no error anywhere.

/** Fold Turkish letters and accents down to ASCII, lowercase. */
export function normalize(value) {
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

export function slugify(brand, model) {
  return normalize(`${brand}-${model}`)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Comparison key: normalized, punctuation collapsed, spaces stripped.
 *  "Mercedes-Benz C-Class" and "Mercedes Benz C Class" both become
 *  "mercedesbenzcclass", which is what lets the catalogue match auto-data.net. */
export function matchKey(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "");
}
