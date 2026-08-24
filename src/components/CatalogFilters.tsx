"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { BODY_TYPES, POWERTRAINS, type BodyType, type Powertrain } from "@/lib/types";

export type BodyFilter = BodyType | "all";
export type PowerFilter = Powertrain | "all";

export interface CatalogFilterState {
  query: string;
  body: BodyFilter;
  power: PowerFilter;
  brand: string;
}

export const EMPTY_FILTERS: CatalogFilterState = {
  query: "",
  body: "all",
  power: "all",
  brand: "all",
};

export function isFiltered(f: CatalogFilterState): boolean {
  return f.query !== "" || f.body !== "all" || f.power !== "all" || f.brand !== "all";
}

/** One row of chips. Radios rather than buttons: exactly one value is active,
 *  so the grouping and arrow-key navigation come from the platform. */
function ChipRow<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  labelFor,
}: {
  name: string;
  legend: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelFor: (v: T) => string;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="hidden w-14 shrink-0 font-mono-tab text-eyebrow font-semibold text-text-dim sm:block"
        >
          {legend}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {options.map((opt) => (
            <label
              key={opt}
              className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent [@media(pointer:coarse)]:grid [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:place-items-center ${
                value === opt
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-text-muted hover:border-text-dim hover:text-text"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {labelFor(opt)}
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

export function CatalogFilters({
  value,
  onChange,
  brands,
  resultCount,
}: {
  value: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  brands: string[];
  resultCount: number;
}) {
  const t = useTranslations("filters");
  const tb = useTranslations("bodyTypes");
  const tp = useTranslations("powertrains");
  const uid = useId();
  const set = (patch: Partial<CatalogFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id={`${uid}-q`}
            type="search"
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent [@media(pointer:coarse)]:min-h-11"
          />
        </div>

        <label className="sr-only" htmlFor={`${uid}-brand`}>{t("brandLabel")}</label>
        <select
          id={`${uid}-brand`}
          value={value.brand}
          onChange={(e) => set({ brand: e.target.value })}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent [@media(pointer:coarse)]:min-h-11"
        >
          <option value="all">{t("allBrands")}</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {isFiltered(value) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-text-muted transition-[border-color,color,transform] duration-150 ease-out hover:border-accent hover:text-accent active:scale-[0.98] [@media(pointer:coarse)]:min-h-11"
          >
            {t("clear")}
          </button>
        )}
      </div>

      <ChipRow
        name={`${uid}-body`}
        legend={t("bodyLegend")}
        options={["all", ...BODY_TYPES] as const}
        value={value.body}
        onChange={(v) => set({ body: v as BodyFilter })}
        labelFor={(v) => (v === "all" ? t("allBodies") : tb(v as BodyType))}
      />

      <ChipRow
        name={`${uid}-power`}
        legend={t("powerLegend")}
        options={["all", ...POWERTRAINS] as const}
        value={value.power}
        onChange={(v) => set({ power: v as PowerFilter })}
        labelFor={(v) => (v === "all" ? t("allPowertrains") : tp(v as Powertrain))}
      />

      <p aria-live="polite" className="text-xs text-text-dim">
        {t("resultCount", { count: resultCount })}
      </p>
    </div>
  );
}
