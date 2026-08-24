import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { COUNTRY_OVERRIDE_COOKIE, isCountryCode } from "@/lib/country";

const handleI18n = createMiddleware(routing);

// Locale resolution (pathname → NEXT_LOCALE cookie → Accept-Language →
// defaultLocale) is next-intl's; it deliberately never looks at the visitor's
// IP, so a VPN does not and should not change the site's language.
export default function proxy(request: NextRequest) {
  const response = handleI18n(request);

  if (isOverrideAllowed()) {
    const requested = request.nextUrl.searchParams.get("country");
    if (requested === "") {
      response.cookies.delete(COUNTRY_OVERRIDE_COOKIE);
    } else if (isCountryCode(requested)) {
      response.cookies.set({
        name: COUNTRY_OVERRIDE_COOKIE,
        value: requested.toUpperCase(),
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60,
      });
    }
  }

  return response;
}

// Testing aid only. Never in production: a crafted link must not be able to
// change what a real visitor sees, and it would let anyone vary a cacheable
// URL's content by query string.
function isOverrideAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
