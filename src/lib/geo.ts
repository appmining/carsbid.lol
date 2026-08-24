import "server-only";
import { headers } from "next/headers";

const FALLBACK_COUNTRY_CODE = "TR";

// Vercel injects the visitor's country as an ISO 3166-1 alpha-2 code on
// every request at the edge — no external geo-IP service needed. Falls
// back to Turkey (this site's home market) locally or if the header is
// absent for any reason.
export async function getVisitorCountryName(locale: string): Promise<string> {
  const headerList = await headers();
  const countryCode = headerList.get("x-vercel-ip-country") || FALLBACK_COUNTRY_CODE;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    return displayNames.of(countryCode) ?? displayNames.of(FALLBACK_COUNTRY_CODE) ?? "Türkiye";
  } catch {
    return "Türkiye";
  }
}
