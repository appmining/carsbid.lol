"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CARS } from "@/data/cars";
import { useCarsStore } from "@/lib/store";
import { CarPhoto } from "@/components/CarPhoto";
import { PatronCard } from "@/components/PatronCard";
import { formatNumber } from "@/lib/format";
import { ScrollReveal } from "@/components/ScrollReveal";

export function PatronCarousel() {
  const { getVotes, getPatron } = useCarsStore();
  const t = useTranslations("patronCarousel");
  const locale = useLocale();
  const top = [...CARS]
    .map((car) => ({ car, votes: getVotes(car.slug) }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 8);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold">{t("title")}</h2>
        <p className="text-sm text-text-dim mt-0.5">{t("subtitle")}</p>
      </div>
      <ScrollReveal
        y={16}
        stagger={0.06}
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]"
      >
        {top.map(({ car, votes }, i) => (
          <div
            key={car.slug}
            className="w-64 shrink-0 rounded-2xl border border-border-soft bg-surface/60 p-4"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-bold text-text-dim w-4">{i + 1}</span>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <CarPhoto
                  slug={car.slug}
                  brand={car.brand}
                  className="h-full w-full"
                  fallbackBadgeSize="sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/araba/${car.slug}`}
                  locale={locale}
                  className="block font-semibold text-sm truncate hover:text-accent-2"
                >
                  {car.brand} {car.model}
                </Link>
                <div className="text-[11px] text-text-dim">
                  {formatNumber(votes, locale)} {t("votesSuffix")}
                </div>
              </div>
            </div>
            <PatronCard slug={car.slug} modelLabel={`${car.brand} ${car.model}`} patron={getPatron(car.slug)} />
          </div>
        ))}
      </ScrollReveal>
    </section>
  );
}
