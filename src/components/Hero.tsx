"use client";

import { useEffect, useRef, useState } from "react";
import { claimIgnition } from "@/lib/ignition";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsapConfig";
import { StatsBar } from "@/components/StatsBar";
import { useMagnetic } from "@/lib/useMagnetic";
import { prefersReducedMotion } from "@/lib/motion";
import { Link } from "@/i18n/navigation";

function RevealWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={`block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top pb-[0.08em]">
          <span data-hero-word className="inline-block">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

function HeroVideoBackground() {
  const [enabled, setEnabled] = useState(false);

  // One-time capability check after mount — must run after the SSR-matching
  // initial render, so this can't be a lazy useState initializer.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)").matches;
    if (!prefersReducedMotion() && wide) setEnabled(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!enabled) return null;

  return (
    <video
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
      src="/hero-pulse.mp4"
      poster="/hero-pulse-poster.png"
      autoPlay
      muted
      loop
      playsInline
    />
  );
}

export function Hero({ countryName }: { countryName: string }) {
  const root = useRef<HTMLDivElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.3);
  const t = useTranslations("hero");
  const [ignite, setIgnite] = useState(false);

  // Claimed after the SSR-matching first render, like the video capability
  // check above — sessionStorage does not exist on the server.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (claimIgnition()) setIgnite(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (prefersReducedMotion()) {
        gsap.set(
          "[data-hero-word], [data-hero-sub], [data-hero-cta], [data-hero-stats]",
          { opacity: 1, y: 0, yPercent: 0, scale: 1 }
        );
        gsap.set("[data-hero-backlight]", { opacity: 1 });
        return;
      }
      // The backlight coming up is the first beat: the panel is dark, then lit.
      tl.fromTo(
        "[data-hero-backlight]",
        { opacity: 0 },
        { opacity: 1, duration: 0.22, ease: "power2.out" },
        0
      )
        // Overlapping, not queued: the light must lead the type by a beat, not
        // hold it back for its full 220ms.
        .fromTo(
          "[data-hero-word]",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.035, ease: "expo.out" },
          0.08
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
      <div
        data-hero-backlight
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-0 [background:radial-gradient(55%_60%_at_50%_0%,rgb(255_176_32/0.12),transparent_70%)]"
      />
      <HeroVideoBackground />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 pb-12 text-center">
        <h1 className="text-balance font-display text-hero font-bold">
          <RevealWords text={t("titleLine1", { country: countryName })} />
          <RevealWords text={t("titleLine2", { country: countryName })} className="text-accent" />
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
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg shadow-backlight transition-[background-color,transform] duration-150 ease-out hover:bg-accent-2 active:scale-[0.97]"
          >
            {t("ctaVote")}
          </a>
          <Link
            data-hero-cta
            href="/patronlar"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-[border-color,color,transform] duration-150 ease-out hover:border-gold hover:text-gold active:scale-[0.97]"
          >
            {t("ctaPatron")}
          </Link>
        </div>

        <div data-hero-stats className="mt-12 flex justify-center">
          <StatsBar sweep={ignite} />
        </div>
      </div>
    </section>
  );
}
