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
  const barWidth = maxVotes > 0 ? Math.max(4, (votes / maxVotes) * 100) : 0;
  const rankStyle =
    rank === 1
      ? "bg-gold text-black"
      : rank === 2
      ? "bg-zinc-300 text-black"
      : rank === 3
      ? "bg-amber-700 text-white"
      : "bg-surface-2 text-text-muted";

  return (
    <div className="rounded-xl border border-border-soft bg-surface/50 p-3.5 sm:p-4 animate-rise-in">
      <div className="flex items-start gap-3">
        <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${rankStyle}`}>
          {rank}
        </div>

        <Link
          href={`/araba/${car.slug}`}
          locale={locale}
          className="block h-10 w-10 shrink-0 overflow-hidden rounded-lg"
        >
          <CarPhoto
            slug={car.slug}
            brand={car.brand}
            className="h-full w-full"
            fallbackBadgeSize="sm"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Link
              href={`/araba/${car.slug}`}
              locale={locale}
              className="font-semibold hover:text-accent-2 transition-colors truncate"
            >
              {car.brand} <span className="text-text-muted font-normal">{car.model}</span>
            </Link>
            <span className="text-xs text-text-dim whitespace-nowrap">
              {t("votesLabel", {
                percent: formatPercent(percent, locale),
                votes: formatNumber(votes, locale),
              })}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        <VoteButton slug={car.slug} className="shrink-0" />
      </div>

      <div className="mt-3 sm:pl-[3.75rem]">
        <PatronCard slug={car.slug} modelLabel={`${car.brand} ${car.model}`} patron={patron} compact />
      </div>
    </div>
  );
}
