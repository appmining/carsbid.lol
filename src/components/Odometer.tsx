"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

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
      const reduced =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;
      if (!colRef.current) return;
      if (reduced) {
        gsap.set(colRef.current, { yPercent: -digit * 10 });
        return;
      }
      gsap.fromTo(
        colRef.current,
        { yPercent: 0 },
        {
          yPercent: -digit * 10,
          duration: 1.1 + index * 0.12,
          delay: index * 0.05,
          ease: "power3.out",
        }
      );
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

export function Odometer({
  value,
  minDigits = 1,
  size = "md",
  className = "",
}: {
  value: number;
  minDigits?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const clamped = Math.max(0, Math.round(value));
  const str = String(clamped).padStart(minDigits, "0");
  const digits = str.split("").map(Number);

  return (
    <div className={`flex gap-[0.09em] ${className}`} aria-label={String(clamped)}>
      {digits.map((d, i) => (
        <DigitTile key={i} digit={d} index={i} size={size} />
      ))}
    </div>
  );
}
