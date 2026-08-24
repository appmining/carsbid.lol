"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CARS } from "@/data/cars";
import { useCarsStore } from "@/lib/store";
import { CarPhoto } from "@/components/CarPhoto";
import { formatNumber } from "@/lib/format";
import { ScrollReveal } from "@/components/ScrollReveal";

export function ShowcaseGrid() {
  const { getVotes } = useCarsStore();
  const t = useTranslations("showcaseGrid");
  const locale = useLocale();

  const withVotes = CARS.map((c) => ({ car: c, votes: getVotes(c.slug) })).sort(
    (a, b) => b.votes - a.votes
  );
  const max = withVotes[0]?.votes ?? 1;
  const min = withVotes[withVotes.length - 1]?.votes ?? 0;
  const top = withVotes.slice(0, 30);

  return (
    <section className="rounded-2xl border border-border-soft bg-surface/60 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h2 className="font-display text-lg font-bold">{t("title")}</h2>
          <p className="text-sm text-text-dim mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim">
          <span>{t("lowVotes")}</span>
          <span className="h-2 w-20 rounded-full bg-gradient-to-r from-surface-2 to-accent" />
          <span>{t("highVotes")}</span>
        </div>
      </div>

      <ScrollReveal
        y={14}
        stagger={0.02}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5"
      >
        {top.map(({ car, votes }) => {
          const intensity = max === min ? 0.5 : (votes - min) / (max - min);
          const tint = `color-mix(in oklab, var(--color-accent) ${Math.round(
            20 + intensity * 55
          )}%, transparent)`;
          return (
            <Link
              key={car.slug}
              href={`/araba/${car.slug}`}
              locale={locale}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border-soft transition-transform hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                <CarPhoto
                  slug={car.slug}
                  brand={car.brand}
                  className="h-full w-full"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
                />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, transparent 30%, rgba(7,8,10,0.55) 65%, rgba(7,8,10,0.92) 100%), linear-gradient(180deg, transparent 60%, ${tint} 100%)`,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                <div className="text-[11px] text-white/70 leading-none">{car.brand}</div>
                <div className="text-sm font-semibold leading-tight text-white truncate">
                  {car.model}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-white/85">
                  {formatNumber(votes, locale)} {t("votesSuffix")}
                </div>
              </div>
            </Link>
          );
        })}
      </ScrollReveal>

      <p className="mt-4 text-center text-[11px] text-text-dim">{t("photoCredit")}</p>
    </section>
  );
}
