"use client";

import { useTranslations } from "next-intl";
import { useCarsStore } from "@/lib/store";
import { Odometer } from "@/components/Odometer";

function Gauge({
  value,
  label,
  minDigits,
  live,
  sweep,
  sweepDelay,
}: {
  value: number;
  label: string;
  minDigits: number;
  live?: boolean;
  sweep?: boolean;
  sweepDelay?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <Odometer
          value={value}
          minDigits={minDigits}
          size="md"
          sweep={sweep}
          sweepDelay={sweepDelay}
        />
        {live && (
          <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-good animate-pulse-dot" />
        )}
      </div>
      <span className="text-eyebrow font-semibold text-text-dim">
        {label}
      </span>
    </div>
  );
}

/** `sweep` runs the ignition self-test across the four gauges, left to right. */
export function StatsBar({ sweep = false }: { sweep?: boolean }) {
  const { online, totalVisits, totalVotes, patronCount } = useCarsStore();
  const t = useTranslations("statsBar");
  const stagger = (i: number) => (sweep ? i * 90 : 0);
  return (
    <div className="inline-flex flex-wrap items-start justify-center gap-x-6 gap-y-5 sm:gap-x-9 rounded-2xl border border-border-soft bg-surface/40 px-5 py-5 sm:px-8 sm:py-6 shadow-e2">
      <Gauge
        value={online}
        label={t("online")}
        minDigits={3}
        live
        sweep={sweep}
        sweepDelay={stagger(0)}
      />
      <div className="hidden sm:block w-px self-stretch bg-border-soft" />
      <Gauge
        value={totalVisits}
        label={t("visits")}
        minDigits={5}
        sweep={sweep}
        sweepDelay={stagger(1)}
      />
      <div className="hidden sm:block w-px self-stretch bg-border-soft" />
      <Gauge
        value={totalVotes}
        label={t("votes")}
        minDigits={4}
        sweep={sweep}
        sweepDelay={stagger(2)}
      />
      <div className="hidden sm:block w-px self-stretch bg-border-soft" />
      <Gauge
        value={patronCount}
        label={t("patrons")}
        minDigits={3}
        sweep={sweep}
        sweepDelay={stagger(3)}
      />
    </div>
  );
}
