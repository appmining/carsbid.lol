"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CARS } from "@/data/cars.generated";
import type { CarModel } from "@/lib/types";
import { useCarsStore } from "@/lib/store";
import { CarPhoto, getCarImageCredit } from "@/components/CarPhoto";
import { VoteButton } from "@/components/VoteButton";
import { PatronCard } from "@/components/PatronCard";
import { formatNumber, formatPercent } from "@/lib/format";

export function CarDetailClient({ car }: { car: CarModel }) {
  const { getVotes, getPatron, totalVotes } = useCarsStore();
  const t = useTranslations("carDetail");
  const ts = useTranslations("bodyTypes");
  const tpw = useTranslations("powertrains");
  const tr = useTranslations("rankingRow");
  const te = useTranslations("emptyState");
  const locale = useLocale();

  // Only this model's own position is needed, so count the models ahead of it
  // instead of sorting all 3861 on every render.
  const votes = getVotes(car.slug);
  const rank = useMemo(
    () => CARS.reduce((n, c) => (getVotes(c.slug) > votes ? n + 1 : n), 1),
    [getVotes, votes]
  );
  const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
  const ranked = totalVotes > 0;
  const patron = getPatron(car.slug);

  const related = CARS.filter((c) => c.body === car.body && c.slug !== car.slug).slice(0, 4);
  const credit = getCarImageCredit(car.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link href="/#siralama" locale={locale} className="text-sm text-text-dim hover:text-text-muted">
        {t("backToRanking")}
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border-soft">
        <CarPhoto
          slug={car.slug}
          brand={car.brand}
          model={car.model}
          alt={`${car.brand} ${car.model}`}
          variant="wide"
          className="h-56 sm:h-72 w-full"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      </div>
      {credit && (
        <p className="mt-1.5 text-[11px] text-text-dim">
          {t("photoCredit")}{" "}
          <a
            href={credit.sourcePageUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline hover:text-text-muted"
          >
            {credit.sourcePageTitle}, Wikipedia
          </a>
          {credit.artist ? ` — ${credit.artist}` : ""}
          {credit.license ? ` (${credit.license})` : ""}
        </p>
      )}

      <div className="mt-4 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {/* Body, powertrain and production years now come from the scraped
              catalogue, so a model page says something even before any votes. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-muted">
              {ts(car.body)}
            </span>
            {car.powertrain
              .filter((p) => p !== "ice")
              .map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                >
                  {tpw(p)}
                </span>
              ))}
            {car.years && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono-tab text-xs font-medium text-text-muted">
                {car.years[1] === null
                  ? tr("yearsOpen", { from: car.years[0] })
                  : tr("yearsClosed", { from: car.years[0], to: car.years[1] })}
              </span>
            )}
            {ranked && (
              <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold">
                {t("rank", { rank })}
              </span>
            )}
          </div>
          <h1 className="font-display mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
            {car.brand} <span className="text-text-muted font-semibold">{car.model}</span>
          </h1>
          <p className="mt-1 text-sm text-text-dim">
            {ranked
              ? t("votesOf", {
                  votes: formatNumber(votes, locale),
                  percent: formatPercent(percent, locale),
                })
              : te("beFirst")}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <VoteButton slug={car.slug} className="flex-1 py-3 text-base" />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-3">
          {t("patronOf", { model: `${car.brand} ${car.model}` })}
        </h2>
        <PatronCard
          slug={car.slug}
          modelLabel={`${car.brand} ${car.model}`}
          patron={patron}
          historyLimit={8}
        />
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-3">
            {t("relatedModels")}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {related.map((c) => (
              <Link
                key={c.slug}
                href={`/araba/${c.slug}`}
                locale={locale}
                className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-surface/50 p-3 hover:border-border transition-colors"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <CarPhoto
                    slug={c.slug}
                    brand={c.brand}
                    model={c.model}
                    alt={`${c.brand} ${c.model}`}
                    variant="square"
                    sizes="40px"
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.brand}</div>
                  <div className="text-xs text-text-dim truncate">{c.model}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
