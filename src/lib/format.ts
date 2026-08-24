// Callers pass `useLocale()`, which yields the routing locale ("tr" | "en" |
// "es") — not a full BCP-47 tag. Intl resolves those fine, so let it own every
// locale convention: Turkish writes %12,3 with the sign in front, English
// 12.3%, Spanish 12,3 % with a non-breaking space.

export function formatNumber(n: number, locale: string = "tr"): string {
  return new Intl.NumberFormat(locale).format(Math.round(n));
}

/** `n` is a percentage in 0–100, not a fraction. */
export function formatPercent(n: number, locale: string = "tr"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n / 100);
}

// Deliberately not Intl's `style: "currency"`: for es that renders "1284 US$",
// which both loses the grouping separator and changes the symbol. Prices here
// are always USD and always shown the same way, so only the number is localised.
export function formatUSD(n: number, locale: string = "tr"): string {
  return `$${formatNumber(n, locale)}`;
}
