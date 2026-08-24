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
      // transition-colors alone left the press scale snapping with no easing.
      // 150ms is the press-feedback window; anything slower stops reading as
      // a response to the tap.
      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-out [@media(pointer:coarse)]:min-h-11 ${
        voted
          ? "bg-good/15 text-good"
          : "bg-accent text-bg hover:bg-accent-2 active:scale-[0.97]"
      } ${className}`}
    >
      {voted ? t("voted") : t("vote")}
    </button>
  );
}
