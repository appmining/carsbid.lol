"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 sm:px-6 py-24 text-center">
      <span className="font-mono-tab text-eyebrow font-semibold text-redline">ERROR</span>
      <h1 className="font-display text-display font-bold mt-3">{t("title")}</h1>
      <p className="mt-4 text-text-muted">{t("body")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-2 active:scale-[0.97]"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-[border-color,color,transform] duration-150 ease-out hover:border-accent hover:text-accent active:scale-[0.97]"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
