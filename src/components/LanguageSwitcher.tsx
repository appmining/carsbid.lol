"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  tr: "TR",
  en: "EN",
  es: "ES",
};

// Endonyms — a language is named in its own language, so someone who can't read
// the current interface can still find theirs. These are the accessible names;
// the visible label stays the two-letter code.
const LOCALE_NAMES: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  es: "Español",
};

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={`flex items-center gap-0.5 rounded-lg border border-border-soft p-0.5 ${className}`}
    >
      {routing.locales.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-label={LOCALE_NAMES[l]}
            // aria-current, not aria-pressed: this is a set of destinations
            // where exactly one is the current one, not three toggles.
            aria-current={active ? "true" : undefined}
            onClick={() => router.replace(pathname, { locale: l })}
            // 32px tall is fine for a mouse; a finger needs the WCAG 2.2
            // AAA 44px, so coarse pointers get the bigger target.
            className={`grid min-h-8 min-w-10 place-items-center rounded-md px-2 text-xs font-semibold transition-colors [@media(pointer:coarse)]:min-h-11 ${
              active
                ? "bg-accent text-bg"
                : "text-text-muted hover:bg-surface hover:text-text"
            }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
