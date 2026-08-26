import "server-only";

// Fallback only used if the live rate fetch fails — patron prices are
// USD throughout the site, but Shopier's shop currency is TRY-only, so
// checkout needs a conversion. Update if it drifts far from reality.
const FALLBACK_USD_TRY = 48;

export async function usdToTry(amountUsd: number): Promise<number> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?from=USD&to=TRY", {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const rate = json?.rates?.TRY;
    if (typeof rate === "number" && rate > 0) {
      return Math.round(amountUsd * rate * 100) / 100;
    }
  } catch {
    // fall through to static rate
  }
  return Math.round(amountUsd * FALLBACK_USD_TRY * 100) / 100;
}
