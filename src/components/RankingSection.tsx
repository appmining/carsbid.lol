"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CARS } from "@/data/cars";
import { useCarsStore } from "@/lib/store";
import { SegmentTabs, type SegmentFilter } from "@/components/SegmentTabs";
import { RankingRow } from "@/components/RankingRow";
import { formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

export function RankingSection() {
  const { getVotes, totalVotes } = useCarsStore();
  const t = useTranslations("rankingSection");
  const locale = useLocale();
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const ranked = useMemo(() => {
    const filtered = segment === "all" ? CARS : CARS.filter((c) => c.segment === segment);
    return filtered
      .map((car) => ({ car, votes: getVotes(car.slug) }))
      .sort((a, b) => b.votes - a.votes);
  }, [segment, getVotes]);

  const maxVotes = ranked[0]?.votes ?? 1;
  const segmentTotal = ranked.reduce((s, r) => s + r.votes, 0);

  return (
    <section id="siralama" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 scroll-mt-20">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-xl sm:text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-text-dim">
          {t("subtitle", { count: formatNumber(totalVotes, locale) })}
        </p>
      </div>

      <div className="mb-5">
        <SegmentTabs
          value={segment}
          onChange={(v) => {
            setSegment(v);
            setVisible(PAGE_SIZE);
          }}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {ranked.slice(0, visible).map(({ car, votes }, i) => (
          <RankingRow
            key={car.slug}
            rank={i + 1}
            car={car}
            votes={votes}
            percent={segmentTotal > 0 ? (votes / segmentTotal) * 100 : 0}
            maxVotes={maxVotes}
          />
        ))}
      </div>

      {visible < ranked.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-5 w-full rounded-xl border border-border-soft bg-surface/50 py-3 text-sm font-medium text-text-muted transition-colors hover:border-accent hover:text-accent-2"
        >
          {t("loadMore", { count: ranked.length - visible })}
        </button>
      )}
    </section>
  );
}
