"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CARS } from "@/data/cars.generated";
import { useCarsStore } from "@/lib/store";
import { CarPhoto } from "@/components/CarPhoto";
import { SocialIcon } from "@/components/SocialIcon";
import { formatUSD } from "@/lib/format";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { SocialPlatform } from "@/lib/types";

const MEDALS = [
  { label: "1", ring: "ring-gold", chip: "bg-gold text-bg", height: "sm:h-64" },
  { label: "2", ring: "ring-silver", chip: "bg-silver text-bg", height: "sm:h-56" },
  { label: "3", ring: "ring-bronze", chip: "bg-bronze text-bg", height: "sm:h-48" },
];

export function PatronPodium() {
  const { getPatron } = useCarsStore();
  const t = useTranslations("patronPodium");
  const tn = useTranslations("nav");
  const tp = useTranslations("platforms");
  const locale = useLocale();

  const withPatron = CARS.map((car) => ({ car, patron: getPatron(car.slug) })).filter(
    (x): x is { car: (typeof CARS)[number]; patron: NonNullable<typeof x.patron> } =>
      Boolean(x.patron)
  );

  const isEmpty = withPatron.length === 0;

  const top3 = [...withPatron].sort((a, b) => b.patron.price - a.patron.price).slice(0, 3);
  // Render order: 2nd, 1st, 3rd — the classic podium arrangement.
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-6 text-center">
        <h2 className="font-display text-section font-bold">{t("title")}</h2>
        <p className="text-sm text-text-dim mt-1">{t("subtitle")}</p>
      </div>

      {isEmpty ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border-soft bg-surface/40 px-6 py-10 text-center">
          <p className="text-sm text-text-muted">{t("empty")}</p>
          <Link
            href="/patronlar"
            className="mt-5 inline-block rounded-full border border-accent/35 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-[background-color,color,border-color,transform] duration-150 ease-out hover:border-accent hover:bg-accent hover:text-bg active:scale-[0.98]"
          >
            {tn("becomePatron")}
          </Link>
        </div>
      ) : (
      <ScrollReveal
        y={20}
        stagger={0.08}
        className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4"
      >
        {order.map((entry) => {
          if (!entry) return null;
          const rank = top3.findIndex((t) => t.car.slug === entry.car.slug);
          const medal = MEDALS[rank];
          return (
            <Link
              key={entry.car.slug}
              href={`/araba/${entry.car.slug}`}
              locale={locale}
              className={`group flex w-full sm:w-56 flex-col items-center rounded-2xl border border-border-soft bg-surface/50 p-4 transition-transform hover:-translate-y-1 ${medal.height}`}
            >
              <div
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ${medal.ring}`}
              >
                <CarPhoto
                  slug={entry.car.slug}
                  brand={entry.car.brand}
                  model={entry.car.model}
                  alt={`${entry.car.brand} ${entry.car.model}`}
                  variant="square"
                  sizes="64px"
                  className="h-full w-full"
                />
              </div>
              <span
                className={`mt-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${medal.chip}`}
              >
                {medal.label}
              </span>

              <div className="mt-2 text-center">
                <div className="text-sm font-semibold">
                  {entry.car.brand} <span className="text-text-muted font-normal">{entry.car.model}</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-text-dim">
                  <SocialIcon platform={entry.patron.platform} className="w-3 h-3" />
                  {tp(entry.patron.platform as SocialPlatform)}
                </div>
                <div className="text-xs font-medium text-text-muted truncate max-w-[10rem]">
                  {entry.patron.name}
                </div>
              </div>

              <div className="mt-auto pt-3 text-lg font-bold text-gold">
                {formatUSD(entry.patron.price, locale)}
              </div>
            </Link>
          );
        })}
      </ScrollReveal>
      )}
    </section>
  );
}
