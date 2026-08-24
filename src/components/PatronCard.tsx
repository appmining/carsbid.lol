"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Patron, SocialPlatform } from "@/lib/types";
import { SocialIcon } from "@/components/SocialIcon";
import { formatUSD } from "@/lib/format";
import { BidModal } from "@/components/BidModal";

export function PatronCard({
  slug,
  modelLabel,
  patron,
  compact = false,
  historyLimit = 2,
}: {
  slug: string;
  modelLabel: string;
  patron: Patron | null;
  compact?: boolean;
  historyLimit?: number;
}) {
  const [open, setOpen] = useState(false);
  const nextPrice = (patron?.price ?? 0) + 1;
  const t = useTranslations("patronCard");
  const tp = useTranslations("platforms");
  const locale = useLocale();

  return (
    <div className="rounded-xl border border-border-soft bg-surface-2/60 p-3.5">
      {patron ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <a
              href={patron.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group min-w-0 flex-1"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-accent-2">
                <SocialIcon platform={patron.platform} className="w-3.5 h-3.5" />
                {tp(patron.platform as SocialPlatform)}
              </div>
              <div className="mt-1 font-semibold text-sm truncate group-hover:text-accent-2 transition-colors">
                {patron.name}
              </div>
              {!compact && (
                <p className="mt-0.5 text-xs text-text-dim line-clamp-2">{patron.tagline}</p>
              )}
              <div className="mt-1 text-xs text-text-muted">{patron.handle}</div>
            </a>
            <div className="shrink-0 rounded-lg bg-gold/15 px-2 py-1 text-xs font-bold text-gold">
              {formatUSD(patron.price, locale)}
            </div>
          </div>

          {patron.history.length > 0 && !compact && (
            <div className="mt-2.5 border-t border-border-soft pt-2">
              <div className="text-[11px] text-text-dim mb-1">{t("prevPatrons")}</div>
              <div className="flex flex-col gap-0.5">
                {patron.history.slice(0, historyLimit).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-text-dim">
                    <span className="truncate">{h.name}</span>
                    <span>{formatUSD(h.price, locale)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setOpen(true)}
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {t("takeover", { price: formatUSD(nextPrice, locale) })}
          </button>
        </>
      ) : (
        <div className="text-center py-1">
          <p className="text-xs text-text-dim mb-2.5">{t("noPatronText")}</p>
          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-2"
          >
            {t("becomePatron", { price: formatUSD(1, locale) })}
          </button>
        </div>
      )}

      {open && (
        <BidModal
          slug={slug}
          modelLabel={modelLabel}
          minPrice={nextPrice}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
