"use client";

import { useTranslations } from "next-intl";
import { useCarsStore } from "@/lib/store";
import { Odometer } from "@/components/Odometer";

function Gauge({
  value,
  label,
  minDigits,
  prefix,
  live,
}: {
  value: number;
  label: string;
  minDigits: number;
  prefix?: string;
  live?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {prefix && (
          <span className="font-mono-tab text-lg sm:text-xl font-bold text-text-dim mr-0.5">
            {prefix}
          </span>
        )}
        <Odometer value={value} minDigits={minDigits} size="md" />
        {live && (
          <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-good animate-pulse-dot" />
        )}
      </div>
      <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] text-text-dim">
        {label}
      </span>
    </div>
  );
}

export function StatsBar() {
  const { online, totalVisits, totalVotes, totalRevenue } = useCarsStore();
  const t = useTranslations("statsBar");
  return (
    <div className="inline-flex flex-wrap items-start justify-center gap-x-6 gap-y-5 sm:gap-x-9 rounded-2xl border border-border-soft bg-surface/40 px-5 py-5 sm:px-8 sm:py-6">
      <Gauge value={online} label={t("online")} minDigits={3} live />
      <div className="hidden sm:block w-px self-stretch bg-border-soft" />
      <Gauge value={totalVisits} label={t("visits")} minDigits={5} />
      <div className="hidden sm:block w-px self-stretch bg-border-soft" />
      <Gauge value={totalVotes} label={t("votes")} minDigits={4} />
      <div className="hidden sm:block w-px self-stretch bg-border-soft" />
      <Gauge value={totalRevenue} label={t("revenue")} minDigits={3} prefix="$" />
    </div>
  );
}
