"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCarsStore } from "@/lib/store";
import { countryName } from "@/lib/country";

export function Footer() {
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const locale = useLocale();
  // Named on the client so the locale layout stays static — see /api/stats.
  const { countryCode } = useCarsStore();
  const country = countryName(countryCode, locale);

  return (
    <footer className="border-t border-border-soft mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-base font-bold tracking-tight">
            carsbid<span className="text-accent">.lol</span>
          </div>
          <p className="mt-1 text-sm text-text-dim max-w-sm">{tf("tagline", { country })}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
          <Link href="/#siralama" locale={locale} className="hover:text-text">
            {t("ranking")}
          </Link>
          <Link href="/patronlar" locale={locale} className="hover:text-text">
            {t("patrons")}
          </Link>
          <Link href="/hakkinda" locale={locale} className="hover:text-text">
            {t("about")}
          </Link>
          <Link href="/kurallar" locale={locale} className="hover:text-text">
            {t("rules")}
          </Link>
        </nav>
      </div>
      <div className="border-t border-border-soft/70 py-4 text-center text-xs text-text-dim">
        {tf("disclaimer")}
      </div>
    </footer>
  );
}
