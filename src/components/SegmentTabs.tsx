"use client";

import { useTranslations } from "next-intl";
import { SEGMENTS, type Segment } from "@/lib/types";

export type SegmentFilter = Segment | "all";

export function SegmentTabs({
  value,
  onChange,
}: {
  value: SegmentFilter;
  onChange: (v: SegmentFilter) => void;
}) {
  const t = useTranslations("segments");
  const options: { value: SegmentFilter; label: string }[] = [
    { value: "all", label: t("all") },
    ...SEGMENTS.map((s) => ({ value: s, label: t(s) })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? "border-accent bg-accent-soft text-accent-2"
              : "border-border text-text-muted hover:border-border/80 hover:text-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
