"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  tr: "TR",
  en: "EN",
  es: "ES",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border-soft p-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
            locale === l
              ? "bg-accent text-white"
              : "text-text-muted hover:bg-surface hover:text-text"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
