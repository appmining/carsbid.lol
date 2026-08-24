"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CARS, BRANDS } from "@/data/cars.generated";
import { useCarsStore } from "@/lib/store";
import {
  CatalogFilters,
  EMPTY_FILTERS,
  isFiltered,
  type CatalogFilterState,
} from "@/components/CatalogFilters";
import { RankingRow } from "@/components/RankingRow";
import { matchesQuery } from "@/lib/search";
import { formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

export function RankingSection() {
  const { getVotes, totalVotes } = useCarsStore();
  const t = useTranslations("rankingSection");
  const tf = useTranslations("filters");
  const te = useTranslations("emptyState");
  const locale = useLocale();
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_FILTERS);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Nobody has voted yet: rank numbers, medals and "%0,0 / 0 oy" would all be
  // noise. The list stays a catalogue until the first vote lands.
  const ranked = totalVotes > 0;

  const results = useMemo(() => {
    const matched = CARS.filter(
      (c) =>
        (filters.body === "all" || c.body === filters.body) &&
        (filters.power === "all" || c.powertrain.includes(filters.power)) &&
        (filters.brand === "all" || c.brand === filters.brand) &&
        matchesQuery(c.slug, filters.query)
    ).map((car) => ({ car, votes: getVotes(car.slug) }));

    // CARS already arrives ordered by curated position then prominence, so a
    // stable sort on votes alone keeps well-known models on top while the vote
    // table is empty — which is what stops the Sports tab opening with AC Ace.
    return matched.sort((a, b) => b.votes - a.votes);
  }, [filters, getVotes]);

  const maxVotes = results[0]?.votes ?? 0;
  const shownTotal = results.reduce((sum, r) => sum + r.votes, 0);

  const update = (next: CatalogFilterState) => {
    setFilters(next);
    setVisible(PAGE_SIZE);
  };

  return (
    <section id="siralama" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 scroll-mt-20">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-section font-bold">{t("title")}</h2>
        <p className="text-sm text-text-dim">
          {ranked
            ? t("subtitle", { count: formatNumber(totalVotes, locale) })
            : te("rankingSubtitle", { count: formatNumber(CARS.length, locale) })}
        </p>
      </div>

      <div className="mb-5">
        <CatalogFilters
          value={filters}
          onChange={update}
          brands={BRANDS}
          resultCount={results.length}
        />
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-surface/40 px-6 py-12 text-center">
          <p className="font-display text-lg font-bold">{tf("noResultsTitle")}</p>
          <p className="mt-2 text-sm text-text-muted">{tf("noResultsBody")}</p>
          {isFiltered(filters) && (
            <button
              type="button"
              onClick={() => update(EMPTY_FILTERS)}
              className="mt-5 rounded-full border border-accent/35 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-[background-color,color,border-color,transform] duration-150 ease-out hover:border-accent hover:bg-accent hover:text-bg active:scale-[0.98]"
            >
              {tf("clear")}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {results.slice(0, visible).map(({ car, votes }, i) => (
            <RankingRow
              key={car.slug}
              rank={i + 1}
              car={car}
              votes={votes}
              percent={shownTotal > 0 ? (votes / shownTotal) * 100 : 0}
              maxVotes={maxVotes}
              ranked={ranked}
            />
          ))}
        </div>
      )}

      {visible < results.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-5 w-full rounded-xl border border-border-soft bg-surface/50 py-3 text-sm font-medium text-text-muted transition-[border-color,color] duration-150 ease-out hover:border-accent hover:text-accent"
        >
          {t("loadMore", { count: results.length - visible })}
        </button>
      )}
    </section>
  );
}
