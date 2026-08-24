"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CARS } from "@/data/cars";
import { useCarsStore } from "@/lib/store";
import { CarPhoto } from "@/components/CarPhoto";
import { formatNumber } from "@/lib/format";
import { ScrollReveal } from "@/components/ScrollReveal";

const TOP_COUNT = 16;

type Tier = "hero" | "wide" | "standard";

function tierFor(rank: number): Tier {
  if (rank === 1) return "hero";
  if (rank <= 3) return "wide";
  return "standard";
}

const TIER_SPAN: Record<Tier, string> = {
  hero: "col-span-2 row-span-2",
  wide: "col-span-2 row-span-1",
  standard: "col-span-1 row-span-1",
};

const TIER_MODEL_TEXT: Record<Tier, string> = {
  hero: "text-xl sm:text-2xl",
  wide: "text-base sm:text-lg",
  standard: "text-sm",
};

const RANK_BADGE: Record<number, string> = {
  1: "bg-gold text-black",
  2: "bg-zinc-300 text-black",
  3: "bg-amber-700 text-white",
};

export function ShowcaseGrid() {
  const { getVotes } = useCarsStore();
  const t = useTranslations("showcaseGrid");
  const locale = useLocale();

  const withVotes = CARS.map((c) => ({ car: c, votes: getVotes(c.slug) })).sort(
    (a, b) => b.votes - a.votes
  );
  const max = withVotes[0]?.votes ?? 1;
  const min = withVotes[withVotes.length - 1]?.votes ?? 0;
  const top = withVotes.slice(0, TOP_COUNT);

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
        className="grid grid-flow-dense grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 auto-rows-[104px] sm:auto-rows-[118px] lg:auto-rows-[132px] gap-2.5"
      >
        {top.map(({ car, votes }, i) => {
          const rank = i + 1;
          const tier = tierFor(rank);
          const intensity = max === min ? 0.5 : (votes - min) / (max - min);
          const tint = `color-mix(in oklab, var(--color-accent) ${Math.round(
            20 + intensity * 55
          )}%, transparent)`;
          const badge = RANK_BADGE[rank];

          return (
            <Link
              key={car.slug}
              href={`/araba/${car.slug}`}
              locale={locale}
              className={`group relative overflow-hidden rounded-xl border border-border-soft transition-transform hover:-translate-y-0.5 ${TIER_SPAN[tier]}`}
            >
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                <CarPhoto
                  slug={car.slug}
                  brand={car.brand}
                  className="h-full w-full"
                  sizes={
                    tier === "hero"
                      ? "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 380px"
                      : tier === "wide"
                      ? "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 360px"
                      : "(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
                  }
                />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, transparent 25%, rgba(7,8,10,0.6) 65%, rgba(7,8,10,0.94) 100%), linear-gradient(180deg, transparent 55%, ${tint} 100%)`,
                }}
              />

              {badge && (
                <div
                  className={`absolute left-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold ${badge}`}
                >
                  {rank}
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-[11px] text-white/70 leading-none">{car.brand}</div>
                <div
                  className={`font-semibold leading-tight text-white truncate ${TIER_MODEL_TEXT[tier]}`}
                >
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
