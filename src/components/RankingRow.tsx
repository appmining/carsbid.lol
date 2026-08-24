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
}: {
  rank: number;
  car: CarModel;
  votes: number;
  percent: number;
  maxVotes: number;
}) {
  const { getPatron } = useCarsStore();
  const patron = getPatron(car.slug);
  const t = useTranslations("rankingRow");
  const locale = useLocale();
  const barWidth = maxVotes > 0 ? Math.max(6, (votes / maxVotes) * 100) : 6;
  const rankStyle =
    rank === 1
      ? "bg-gold text-bg"
      : rank === 2
      ? "bg-silver text-bg"
      : rank === 3
      ? "bg-bronze text-bg"
      : "bg-surface-2/80 text-text-muted backdrop-blur-sm";

  return (
    <div className="rounded-xl border border-border-soft bg-surface/50 overflow-hidden animate-rise-in transition-colors hover:border-border">
      <div className="relative h-20 sm:h-24">
        {/* dim full-photo backdrop, always visible */}
        <div className="absolute inset-0 opacity-[0.14]">
          <CarPhoto slug={car.slug} brand={car.brand} alt={`${car.brand} ${car.model}`} className="h-full w-full" sizes="600px" />
        </div>

        {/* vivid photo, revealed left-to-right in proportion to vote share */}
        <div
          className="absolute inset-0 transition-[clip-path] duration-700 ease-out"
          style={{ clipPath: `inset(0 ${100 - barWidth}% 0 0)` }}
        >
          <CarPhoto slug={car.slug} brand={car.brand} className="h-full w-full" sizes="600px" />
        </div>

        {/* legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-bg/10" />

        <div className="relative flex h-full items-center gap-3 px-3.5 sm:px-4">
          <div
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${rankStyle}`}
          >
            {rank}
          </div>

          <Link
            href={`/araba/${car.slug}`}
            locale={locale}
            className="min-w-0 flex-1 transition-opacity hover:opacity-90"
          >
            <div className="font-semibold truncate">
              {car.brand} <span className="text-text-muted font-normal">{car.model}</span>
            </div>
            <div className="mt-0.5 text-xs text-text-dim whitespace-nowrap">
              {t("votesLabel", {
                percent: formatPercent(percent, locale),
                votes: formatNumber(votes, locale),
              })}
            </div>
          </Link>

          <VoteButton slug={car.slug} className="shrink-0" />
        </div>
      </div>

      <div className="border-t border-border-soft/60 px-3.5 sm:px-4 py-3">
        <PatronCard slug={car.slug} modelLabel={`${car.brand} ${car.model}`} patron={patron} compact />
      </div>
    </div>
  );
}
