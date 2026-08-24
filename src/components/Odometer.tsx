"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

const DIGIT_COLUMN = Array.from({ length: 10 }, (_, i) => i);

function DigitTile({
  digit,
  index,
  size,
}: {
  digit: number;
  index: number;
  size: "sm" | "md" | "lg";
}) {
  const colRef = useRef<HTMLDivElement>(null);
  const dims =
    size === "lg"
      ? "w-[0.62em] h-[1.15em] text-[2.4rem] sm:text-[3.4rem]"
      : size === "md"
      ? "w-[0.6em] h-[1.15em] text-xl sm:text-2xl"
      : "w-[0.62em] h-[1.15em] text-sm";

  useGSAP(
    () => {
      if (!colRef.current) return;
      if (prefersReducedMotion()) {
        gsap.set(colRef.current, { yPercent: -digit * 10 });
        return;
      }
      // Not a fromTo: retargeting from wherever the column currently sits is
      // what lets the ignition sweep interrupt itself smoothly instead of
      // snapping back to zero when the real value arrives.
      gsap.to(colRef.current, {
        yPercent: -digit * 10,
        duration: 0.8 + index * 0.08,
        delay: index * 0.05,
        ease: "power3.out",
        overwrite: "auto",
      });
    },
    { dependencies: [digit], scope: colRef }
  );

  return (
    <div className={`odometer-tile ${dims} font-mono-tab font-bold text-text leading-none`}>
      <div ref={colRef} className="flex flex-col will-change-transform">
        {DIGIT_COLUMN.map((d) => (
          <span key={d} className="h-[1.15em] grid place-items-center">
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

/** How long the gauge holds at full before dropping to the real reading. */
const SWEEP_HOLD_MS = 700;

export function Odometer({
  value,
  minDigits = 1,
  size = "md",
  className = "",
  sweep = false,
  sweepDelay = 0,
}: {
  value: number;
  minDigits?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Run the ignition self-test: rise to full, then settle on the real value. */
  sweep?: boolean;
  sweepDelay?: number;
}) {
  const clamped = Math.max(0, Math.round(value));
  const width = Math.max(String(clamped).length, minDigits);

  // Only the sweep is state; the resting value is derived. That way the effect
  // never sets state synchronously, and once the sweep clears the gauge tracks
  // the real number again — including updates that land while it is running.
  const [sweepValue, setSweepValue] = useState<number | null>(null);

  useEffect(() => {
    if (!sweep) return;
    // Every car sweeps its gauges to full on ignition before dropping to the
    // real reading. That is the whole signature: the site starting up.
    const full = Number("9".repeat(width));
    const up = setTimeout(() => setSweepValue(full), sweepDelay);
    const settle = setTimeout(() => setSweepValue(null), sweepDelay + SWEEP_HOLD_MS);
    return () => {
      clearTimeout(up);
      clearTimeout(settle);
    };
  }, [sweep, sweepDelay, width]);

  const display = sweepValue ?? clamped;
  const digits = String(display).padStart(width, "0").split("").map(Number);

  return (
    // The label carries the real value, never the sweep — and the digit columns
    // render 0-9 each, which a screen reader would otherwise read aloud.
    <div
      className={`flex gap-[0.09em] ${className}`}
      role="img"
      aria-label={String(clamped)}
    >
      {digits.map((d, i) => (
        <DigitTile key={i} digit={d} index={i} size={size} />
      ))}
    </div>
  );
}
