"use client";

import { useTranslations } from "next-intl";
import { useCarsStore } from "@/lib/store";

export function VoteButton({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const { hasVoted, vote, hydrated } = useCarsStore();
  const voted = hydrated && hasVoted(slug);
  const t = useTranslations("voteButton");

  return (
    <button
      onClick={() => vote(slug)}
      disabled={voted}
      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
        voted
          ? "bg-good/15 text-good cursor-default"
          : "bg-accent text-white hover:bg-accent-2 active:scale-[0.98]"
      } ${className}`}
    >
      {voted ? t("voted") : t("vote")}
    </button>
  );
}
