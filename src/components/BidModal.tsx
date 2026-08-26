"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/types";
import { SocialIcon } from "@/components/SocialIcon";
import { formatUSD } from "@/lib/format";

/** Must match the exit duration in globals.css, so the dialog is still in the
 *  top layer while it animates out and only unmounts afterwards. */
const EXIT_MS = 170;

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent";
const LABEL = "block text-xs font-medium text-text-muted mb-1.5";

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
  // Website/Other aren't @handles — asking for one there reads as broken.
  const isLinkPlatform = platform === "website" || platform === "diger";
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState(minPrice);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("bidModal");
  const tp = useTranslations("platforms");
  const locale = useLocale();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const fid = (field: string) => `${uid}-${field}`;

  // A native <dialog> opened with showModal() brings the focus trap, Escape
  // handling, the backdrop, background inertness, and focus restore on close —
  // all of which this modal previously had none of.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // showModal makes the rest of the page inert but does not stop it scrolling.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function requestClose() {
    const dialog = dialogRef.current;
    if (!dialog) {
      onClose();
      return;
    }
    dialog.close();
    window.setTimeout(onClose, EXIT_MS);
  }

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

    const bare = handle.replace(/^@/, "");
    const url =
      platform === "instagram"
        ? `https://instagram.com/${bare}`
        : platform === "tiktok"
        ? `https://tiktok.com/@${bare}`
        : platform === "x"
        ? `https://x.com/${bare}`
        : platform === "youtube"
        ? `https://youtube.com/@${bare}`
        : handle.startsWith("http")
        ? handle
        : `https://${handle}`;

    setSubmitting(true);
    try {
      const res = await fetch("/api/patron/shopier/checkout", {
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
    <dialog
      ref={dialogRef}
      aria-labelledby={fid("title")}
      // Escape fires cancel first; routing it through requestClose keeps the
      // exit animation on every path out of the dialog.
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      // On a backdrop click the event target is the dialog itself, never the panel.
      onClick={(e) => {
        if (e.target === dialogRef.current) requestClose();
      }}
      className="cb-dialog w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-bg-soft p-5 sm:p-6 shadow-e3 max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id={fid("title")} className="font-display text-lg font-bold">
              {t("title", { model: modelLabel })}
            </h2>
            <p className="text-xs text-text-dim mt-0.5">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t("close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-text-dim transition-colors hover:bg-surface hover:text-text [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Real radios rather than buttons: one choice out of a set, so the
            grouping, arrow-key navigation and announcement come for free. */}
        <fieldset className="mb-4 border-0 p-0">
          <legend className={LABEL}>{t("platform")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {SOCIAL_PLATFORMS.map((p) => (
              <label
                key={p}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent [@media(pointer:coarse)]:min-h-11 ${
                  platform === p
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-text-muted hover:border-text-dim"
                }`}
              >
                <input
                  type="radio"
                  name={fid("platform")}
                  value={p}
                  checked={platform === p}
                  onChange={() => setPlatform(p)}
                  className="sr-only"
                />
                <SocialIcon platform={p} className="w-3.5 h-3.5" />
                {tp(p)}
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor={fid("name")} className={LABEL}>
          {t("displayName")}
        </label>
        <input
          id={fid("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("displayNamePlaceholder")}
          maxLength={40}
          autoComplete="off"
          className={`${FIELD} mb-3`}
        />

        <label htmlFor={fid("handle")} className={LABEL}>
          {isLinkPlatform ? t("handleLink") : t("handle")}
        </label>
        <input
          id={fid("handle")}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={isLinkPlatform ? t("handleLinkPlaceholder") : t("handlePlaceholder")}
          type={isLinkPlatform ? "url" : "text"}
          maxLength={80}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`${FIELD} mb-3`}
        />

        <label htmlFor={fid("tagline")} className={LABEL}>
          {t("tagline")}
        </label>
        <input
          id={fid("tagline")}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder={t("taglinePlaceholder")}
          maxLength={80}
          className={`${FIELD} mb-3`}
        />

        <label htmlFor={fid("price")} className={LABEL}>
          {t("offer", { min: formatUSD(minPrice, locale) })}
        </label>
        <div className="mb-1 flex items-center rounded-lg border border-border bg-surface px-3 py-2 transition-colors focus-within:border-accent">
          <span className="text-text-dim text-sm mr-1" aria-hidden>
            $
          </span>
          <input
            id={fid("price")}
            type="number"
            inputMode="numeric"
            step={1}
            min={minPrice}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* role="alert" so it is announced, and the redline colour so it reads
            as a failure — it used to be rendered in the accent, like a hint. */}
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-redline">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-2 active:scale-[0.98] disabled:opacity-60 [@media(pointer:coarse)]:min-h-11"
        >
          {submitting ? t("submitting") : t("submit", { price: formatUSD(price, locale) })}
        </button>
        <p className="mt-2 text-center text-[11px] text-text-dim">{t("redirectNote")}</p>
      </form>
    </dialog>
  );
}
