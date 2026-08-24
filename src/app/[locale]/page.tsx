import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/Hero";
import { ShowcaseGrid } from "@/components/ShowcaseGrid";
import { PatronPodium } from "@/components/PatronPodium";
import { PatronCarousel } from "@/components/PatronCarousel";
import { RankingSection } from "@/components/RankingSection";
import { getVisitorCountryName } from "@/lib/geo";

// Overrides the layout's home-market title with the visitor's own country. This
// route already reads request headers for the headline, so it costs nothing
// extra — and crawlers are served the home market (see src/lib/geo.ts).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [t, country] = await Promise.all([
    getTranslations({ locale, namespace: "meta" }),
    getVisitorCountryName(locale),
  ]);
  return {
    title: t("title", { country }),
    description: t("description"),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const countryName = await getVisitorCountryName(locale);

  return (
    <>
      <Hero countryName={countryName} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ShowcaseGrid />
      </div>
      <PatronPodium />
      <PatronCarousel />
      <RankingSection />
    </>
  );
}
