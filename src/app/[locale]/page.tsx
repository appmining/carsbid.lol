import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/Hero";
import { ShowcaseGrid } from "@/components/ShowcaseGrid";
import { PatronPodium } from "@/components/PatronPodium";
import { PatronCarousel } from "@/components/PatronCarousel";
import { RankingSection } from "@/components/RankingSection";
import { getVisitorCountryName } from "@/lib/geo";

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
