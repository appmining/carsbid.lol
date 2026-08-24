import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getVisitorCountryName } from "@/lib/geo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hakkindaPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function HakkindaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, country] = await Promise.all([
    getTranslations("hakkindaPage"),
    getVisitorCountryName(locale),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-6">{t("title")}</h1>
      <div className="space-y-5 text-text-muted leading-relaxed">
        <p>
          {t.rich("p1", {
            country,
            strong: (chunks) => <strong className="text-text">{chunks}</strong>,
          })}
        </p>
        <p>{t.rich("p2", { strong: (chunks) => <strong className="text-text">{chunks}</strong> })}</p>
        <p>{t("p3")}</p>
        <p>{t("p4")}</p>
      </div>
    </div>
  );
}
