// Country helpers shared by server components (src/lib/geo.ts) and the client
// (Footer reads the visitor's country out of the store). Nothing here touches
// request state, so it is safe on both sides of the boundary.

/** The site's home market: the ranking data is Turkish-market ordered. Used
 *  when the visitor's country is unknown, and deliberately for crawlers. */
export const HOME_COUNTRY_CODE = "TR";

/** Written by `src/proxy.ts` when `?country=XX` is used outside production. */
export const COUNTRY_OVERRIDE_COOKIE = "cb_country";

export function isCountryCode(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value);
}

// English needs a definite article in front of some country names — "sold in
// the Netherlands", not "sold in Netherlands" — and Intl.DisplayNames does not
// carry that. Plural and collective names take it; the rest do not. Every
// message interpolating a country here does so mid-sentence, so lowercase
// "the " is correct in all of them (title case leaves articles lowercase too).
const EN_DEFINITE_ARTICLE = new Set([
  "AE", "BS", "CD", "CF", "CG", "DO", "GB", "GM", "MV", "NL",
  "PH", "SB", "SC", "SD", "SS", "US", "VA", "VI",
]);

/** ISO 3166-1 alpha-2 → the country's name in `locale`, ready to drop into a
 *  sentence.
 *
 *  This is the single source of the name in every locale, which is what keeps
 *  the `<h1>`, `<title>` and footer from contradicting each other. CLDR also
 *  settles spellings we would get wrong by hand — the English name for `TR` has
 *  been "Türkiye" since CLDR 42, not "Turkey". */
export function countryName(code: string, locale: string): string {
  const normalized = code.toUpperCase();
  let name: string;
  try {
    name = new Intl.DisplayNames([locale], { type: "region" }).of(normalized) ?? normalized;
  } catch {
    return normalized;
  }

  if (locale.startsWith("en") && (EN_DEFINITE_ARTICLE.has(normalized) || name.endsWith("Islands"))) {
    return `the ${name}`;
  }
  return name;
}
