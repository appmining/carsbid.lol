import "server-only";
import { cookies, headers } from "next/headers";
import {
  COUNTRY_OVERRIDE_COOKIE,
  HOME_COUNTRY_CODE,
  countryName,
  isCountryCode,
} from "@/lib/country";

// Crawlers reach the site from wherever their infrastructure lives — Googlebot
// is largely US-based — so personalising their view would get carsbid.lol
// indexed as "the most popular in the United States". They get the home market,
// which is also what the ranking data actually describes.
const CRAWLER_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|embedly|pinterest|applebot|yandex|baiduspider|duckduckbot|semrush|ahrefs|lighthouse|headlesschrome/i;

/** The visitor's country as an ISO 3166-1 alpha-2 code.
 *
 *  Calling this opts the route into dynamic rendering, so only use it on routes
 *  that are already dynamic — never in the locale layout, which would drag the
 *  pre-rendered car pages along with it. */
export async function getVisitorCountryCode(): Promise<string> {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);

  if (CRAWLER_UA.test(headerList.get("user-agent") ?? "")) {
    return HOME_COUNTRY_CODE;
  }

  // `?country=XX`, dev/preview only — see src/proxy.ts. A VPN is not a way to
  // test this: Vercel strips client-supplied `x-vercel-ip-*` headers, so there
  // is otherwise no way to exercise a country other than your own.
  const override = cookieStore.get(COUNTRY_OVERRIDE_COOKIE)?.value;
  if (isCountryCode(override)) return override.toUpperCase();

  // Vercel injects the visitor's country at the edge on every request — no
  // external geo-IP service needed. Absent when running locally.
  const edgeCountry = headerList.get("x-vercel-ip-country");
  return isCountryCode(edgeCountry) ? edgeCountry.toUpperCase() : HOME_COUNTRY_CODE;
}

export async function getVisitorCountryName(locale: string): Promise<string> {
  return countryName(await getVisitorCountryCode(), locale);
}
