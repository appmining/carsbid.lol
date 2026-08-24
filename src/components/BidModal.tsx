"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/types";
import { SocialIcon } from "@/components/SocialIcon";
import { formatUSD } from "@/lib/format";

export function BidModal({
  slug,
  modelLabel,
  minPrice,
  onClose,
}: {
  slug: string;
  modelLabel: string;
  minPrice: number;
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState(minPrice);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("bidModal");
  const tp = useTranslations("platforms");
  const locale = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!handle.trim() || !name.trim()) {
      setError(t("errorHandleName"));
      return;
    }
    if (price < minPrice) {
      setError(t("errorMinPrice", { min: formatUSD(minPrice, locale) }));
      return;
    }

    const url =
      platform === "instagram"
        ? `https://instagram.com/${handle.replace(/^@/, "")}`
        : platform === "tiktok"
        ? `https://tiktok.com/@${handle.replace(/^@/, "")}`
        : platform === "x"
        ? `https://x.com/${handle.replace(/^@/, "")}`
        : platform === "youtube"
        ? `https://youtube.com/@${handle.replace(/^@/, "")}`
        : handle.startsWith("http")
        ? handle
        : `https://${handle}`;

    setSubmitting(true);
    try {
      const res = await fetch("/api/patron/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, tagline, platform, handle, url, price, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("errorGeneric"));
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError(t("errorNetwork"));
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-bg-soft p-5 sm:p-6 animate-rise-in max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">{t("title", { model: modelLabel })}</h3>
              <p className="text-xs text-text-dim mt-0.5">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-dim hover:bg-surface"
            >
              ✕
            </button>
          </div>

          <label className="block text-xs font-medium text-text-muted mb-1.5">
            {t("platform")}
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {SOCIAL_PLATFORMS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                  platform === p
                    ? "border-accent bg-accent-soft text-accent-2"
                    : "border-border text-text-muted hover:border-border/80"
                }`}
              >
                <SocialIcon platform={p} className="w-3.5 h-3.5" />
                {tp(p)}
              </button>
            ))}
          </div>

          <label className="block text-xs font-medium text-text-muted mb-1.5">
            {t("displayName")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("displayNamePlaceholder")}
            maxLength={40}
            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />

          <label className="block text-xs font-medium text-text-muted mb-1.5">
            {t("handle")}
          </label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t("handlePlaceholder")}
            maxLength={40}
            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />

          <label className="block text-xs font-medium text-text-muted mb-1.5">
            {t("tagline")}
          </label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={t("taglinePlaceholder")}
            maxLength={80}
            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />

          <label className="block text-xs font-medium text-text-muted mb-1.5">
            {t("offer", { min: formatUSD(minPrice, locale) })}
          </label>
          <div className="mb-1 flex items-center rounded-lg border border-border bg-surface px-3 py-2 focus-within:border-accent">
            <span className="text-text-dim text-sm mr-1">$</span>
            <input
              type="number"
              min={minPrice}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {error && <p className="mt-2 text-xs text-accent-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-2 active:scale-[0.99] transition-transform disabled:opacity-60"
          >
            {submitting ? t("submitting") : t("submit", { price: formatUSD(price, locale) })}
          </button>
          <p className="mt-2 text-center text-[11px] text-text-dim">{t("redirectNote")}</p>
        </form>
      </div>
    </div>
  );
}
