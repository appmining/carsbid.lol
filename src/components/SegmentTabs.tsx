"use client";

import { useId } from "react";
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
  const name = useId();
  const options: { value: SegmentFilter; label: string }[] = [
    { value: "all", label: t("all") },
    ...SEGMENTS.map((s) => ({ value: s, label: t(s) })),
  ];

  return (
    // Radios rather than buttons: exactly one segment is active at a time, so
    // this is a single choice out of a set. Selection was previously conveyed
    // by colour alone, with no grouping and no keyboard model.
    <fieldset className="border-0 p-0">
      <legend className="sr-only">{t("groupLabel")}</legend>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:grid [@media(pointer:coarse)]:place-items-center ${
              value === opt.value
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-text-muted hover:border-text-dim hover:text-text"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
