import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

const RULE_KEYS = [1, 2, 3, 4, 5] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "kurallarPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function KurallarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("kurallarPage");

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-8">{t("title")}</h1>
      <div className="flex flex-col gap-5">
        {RULE_KEYS.map((n, i) => (
          <div key={n} className="flex gap-4 rounded-xl border border-border-soft bg-surface/40 p-4">
            <span className="font-mono-tab shrink-0 text-sm font-bold text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="font-semibold text-text">{t(`rule${n}Title`)}</h2>
              <p className="mt-1 text-sm text-text-muted leading-relaxed">{t(`rule${n}Body`)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
