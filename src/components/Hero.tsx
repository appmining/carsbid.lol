"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsapConfig";
import { StatsBar } from "@/components/StatsBar";
import { useMagnetic } from "@/lib/useMagnetic";
import { Link } from "@/i18n/navigation";

function RevealWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={`block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top pb-[0.08em]">
          <span data-hero-word className="inline-block">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.3);
  const t = useTranslations("hero");

  useGSAP(
    () => {
      const reduced =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (reduced) {
        gsap.set(
          "[data-hero-word], [data-hero-sub], [data-hero-cta], [data-hero-stats]",
          { opacity: 1, y: 0, yPercent: 0, scale: 1 }
        );
        return;
      }
      tl.fromTo(
        "[data-hero-word]",
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, stagger: 0.035, ease: "expo.out" }
      )
        .fromTo(
          "[data-hero-sub]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.5"
        )
        .fromTo(
          "[data-hero-cta]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          "-=0.35"
        )
        .fromTo(
          "[data-hero-stats]",
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7 },
          "-=0.25"
        );
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-grid-fade">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
        <h1 className="text-balance font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.04]">
          <RevealWords text={t("titleLine1")} />
          <RevealWords text={t("titleLine2")} className="text-accent" />
          <RevealWords text={t("titleLine3")} />
        </h1>

        <p
          data-hero-sub
          className="mx-auto mt-6 max-w-xl text-balance text-base sm:text-lg text-text-muted"
        >
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            ref={ctaRef}
            data-hero-cta
            href="#siralama"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(125,211,252,0.45)] transition-colors hover:bg-accent-2"
          >
            {t("ctaVote")}
          </a>
          <Link
            data-hero-cta
            href="/patronlar"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-gold hover:text-gold"
          >
            {t("ctaPatron")}
          </Link>
        </div>

        <div data-hero-stats className="mt-12 flex justify-center">
          <StatsBar />
        </div>
      </div>
    </section>
  );
}
