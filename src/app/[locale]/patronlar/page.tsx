"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CARS } from "@/data/cars.generated";
import { useCarsStore } from "@/lib/store";
import { BrandBadge } from "@/components/BrandBadge";
import { CarPhoto } from "@/components/CarPhoto";
import { PatronCard } from "@/components/PatronCard";
import { ScrollReveal } from "@/components/ScrollReveal";

const STATUS_KEYS: Record<string, "statusPaid" | "statusOutbid" | "statusFailed" | "statusError"> = {
  paid: "statusPaid",
  outbid: "statusOutbid",
  failed: "statusFailed",
  error: "statusError",
};

function PatronStatusBanner() {
  const { refreshPatrons } = useCarsStore();
  const searchParams = useSearchParams();
  const patronStatus = searchParams.get("patron");
  const t = useTranslations("patronlarPage");
  const key = patronStatus ? STATUS_KEYS[patronStatus] : undefined;
  const tone = patronStatus === "paid" ? "good" : "bad";

  useEffect(() => {
    if (patronStatus) refreshPatrons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patronStatus]);

  if (!key) return null;
  return (
    <div
      className={`mx-auto mt-4 max-w-lg rounded-xl border px-4 py-2.5 text-sm ${
        tone === "good"
          ? "border-good/40 bg-good/10 text-good"
          : "border-accent-2/40 bg-accent-2/10 text-accent-2"
      }`}
    >
      {t(key)}
    </div>
  );
}

/** The unclaimed list is ~3.8k models. Rendering them all mounts a next/image
 *  each and locks up the page on a phone, so it grows a page at a time. */
const UNCLAIMED_PAGE = 60;

export default function PatronlarPage() {
  const { getPatron } = useCarsStore();
  const t = useTranslations("patronlarPage");
  const tr = useTranslations("rankingSection");
  const locale = useLocale();
  const [visible, setVisible] = useState(UNCLAIMED_PAGE);

  // CARS is 3861 entries; without this the whole list is rebuilt on every
  // render, including every unrelated state change on the page.
  const { claimed, unclaimed } = useMemo(() => {
    const withPatron = CARS.map((c) => ({ car: c, patron: getPatron(c.slug) }));
    return {
      claimed: withPatron
        .filter((x) => x.patron)
        .sort((a, b) => (b.patron!.price ?? 0) - (a.patron!.price ?? 0)),
      unclaimed: withPatron.filter((x) => !x.patron),
    };
  }, [getPatron]);

  const shown = unclaimed.slice(0, visible);
  const remaining = unclaimed.length - shown.length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-text-muted">{t("subtitle")}</p>
        <Suspense fallback={null}>
          <PatronStatusBanner />
        </Suspense>
      </div>

      <div className="mb-12">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-4">
          {t("activePatrons", { count: claimed.length })}
        </h2>
        {claimed.length === 0 ? (
          // This page is about patrons; hiding the section when there are none
          // left it looking broken rather than empty.
          <div className="rounded-2xl border border-dashed border-border-soft bg-surface/40 px-6 py-10 text-center text-sm text-text-muted">
            {t("noPatronsYet")}
          </div>
        ) : (
          <ScrollReveal
            y={16}
            stagger={0.04}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {claimed.map(({ car, patron }) => (
              <div key={car.slug} className="rounded-xl border border-border-soft bg-surface/50 p-3.5">
                <Link
                  href={`/araba/${car.slug}`}
                  locale={locale}
                  className="mb-3 flex items-center gap-2.5 hover:opacity-80"
                >
                  <BrandBadge brand={car.brand} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {car.brand} {car.model}
                    </div>
                  </div>
                </Link>
                <PatronCard slug={car.slug} modelLabel={`${car.brand} ${car.model}`} patron={patron} />
              </div>
            ))}
          </ScrollReveal>
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-4">
          {t("waitingModels", { count: unclaimed.length })}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {shown.map(({ car }) => (
            <Link
              key={car.slug}
              href={`/araba/${car.slug}`}
              locale={locale}
              className="flex items-center gap-2.5 rounded-xl border border-dashed border-border-soft p-3 hover:border-accent/60 transition-colors"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <CarPhoto
                  slug={car.slug}
                  brand={car.brand}
                  model={car.model}
                  alt={`${car.brand} ${car.model}`}
                  variant="square"
                  className="h-full w-full"
                  sizes="40px"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{car.brand}</div>
                <div className="text-xs text-text-dim truncate">{car.model}</div>
              </div>
            </Link>
          ))}
        </div>

        {remaining > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + UNCLAIMED_PAGE)}
              className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-muted transition-[border-color,color,transform] duration-150 ease-out hover:border-accent hover:text-accent active:scale-[0.98] [@media(pointer:coarse)]:min-h-11"
            >
              {tr("loadMore", { count: remaining })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
