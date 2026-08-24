"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CarModel } from "@/lib/types";
import { CarPhoto } from "@/components/CarPhoto";
import { VoteButton } from "@/components/VoteButton";
import { PatronCard } from "@/components/PatronCard";
import { formatNumber, formatPercent } from "@/lib/format";
import { useCarsStore } from "@/lib/store";

export function RankingRow({
  rank,
  car,
  votes,
  percent,
  maxVotes,
  ranked,
}: {
  rank: number;
  car: CarModel;
  votes: number;
  percent: number;
  maxVotes: number;
  /** False while the whole list is on zero votes — there is no ranking yet,
   *  so positions and medals would be meaningless. */
  ranked: boolean;
}) {
  const { getPatron } = useCarsStore();
  const patron = getPatron(car.slug);
  const t = useTranslations("rankingRow");
  const tb = useTranslations("bodyTypes");
  const locale = useLocale();

  const share = ranked && maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
  const medal =
    rank === 1 ? "bg-gold text-bg" : rank === 2 ? "bg-silver text-bg" : "bg-bronze text-bg";

  const years = car.years
    ? car.years[1] === null
      ? t("yearsOpen", { from: car.years[0] })
      : t("yearsClosed", { from: car.years[0], to: car.years[1] })
    : "";

  return (
    <div className="overflow-hidden rounded-xl border border-border-soft bg-surface/50 transition-colors hover:border-border">
      <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-3.5">
        {/* Square crop at a size the car is actually readable at. This used to
            be the full-bleed row background at 11.5:1, which threw away 85% of
            the photo and then covered the rest with a scrim. */}
        <Link
          href={`/araba/${car.slug}`}
          locale={locale}
          className="relative shrink-0 transition-transform hover:scale-[1.03]"
          tabIndex={-1}
          aria-hidden
        >
          <CarPhoto
            slug={car.slug}
            brand={car.brand}
            model={car.model}
            variant="square"
            className="h-14 w-14 rounded-lg border border-border-soft sm:h-16 sm:w-16"
            sizes="64px"
          />
          {ranked && rank <= 3 && (
            <span
              className={`absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${medal}`}
            >
              {rank}
            </span>
          )}
        </Link>

        <Link
          href={`/araba/${car.slug}`}
          locale={locale}
          className="min-w-0 flex-1 transition-opacity hover:opacity-90"
        >
          <div className="flex items-baseline gap-2">
            {ranked && rank > 3 && (
              <span className="font-mono-tab text-xs font-semibold text-text-dim">{rank}</span>
            )}
            <span className="truncate font-semibold">
              {car.brand} <span className="font-normal text-text-muted">{car.model}</span>
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs text-text-dim">
            {ranked
              ? t("votesLabel", {
                  percent: formatPercent(percent, locale),
                  votes: formatNumber(votes, locale),
                })
              : /* No votes yet: show what the car IS rather than a row of zeros. */
                t("spec", { body: tb(car.body), years })}
          </div>
        </Link>

        <VoteButton slug={car.slug} className="shrink-0" />
      </div>

      {/* The bar race lives on its own strip now, so it can be honest about
          zero without dragging the photograph down with it. */}
      {ranked && (
        <div className="h-[3px] bg-border-soft/60">
          <div
            className="h-full bg-accent transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(2, share)}%` }}
          />
        </div>
      )}

      {/* A full patron card under all 20 rows was ~1400px of "no patron yet".
          Only models that actually have one get the card. */}
      {patron && (
        <div className="border-t border-border-soft/60 px-3 py-3 sm:px-3.5">
          <PatronCard
            slug={car.slug}
            modelLabel={`${car.brand} ${car.model}`}
            patron={patron}
            compact
          />
        </div>
      )}
    </div>
  );
}
