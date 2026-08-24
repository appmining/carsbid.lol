export function formatNumber(n: number, locale: string = "tr-TR"): string {
  return new Intl.NumberFormat(locale).format(Math.round(n));
}

export function formatPercent(n: number, locale: string = "tr-TR"): string {
  const formatted = `%${n.toFixed(1)}`;
  return locale === "tr-TR" ? formatted.replace(".", ",") : formatted.replace("%", "") + "%";
}

export function formatUSD(n: number, locale: string = "tr-TR"): string {
  return `$${formatNumber(n, locale)}`;
}
