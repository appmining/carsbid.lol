"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsapConfig";

export function CustomCursor() {
  const [active, setActive] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // One-time capability check after mount — must run after the SSR-matching
  // initial render, so this can't be a lazy useState initializer.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!reduced && fine) setActive(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!active || !dotRef.current || !ringRef.current) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    // Deliberately NOT hidden up front: if GSAP never runs, the visitor would
    // be left with no pointer at all. The class goes on at the first tracked
    // move, once the replacement is known to be following.
    let hidden = false;
    function hideSystemCursor() {
      if (hidden) return;
      hidden = true;
      document.body.classList.add("cb-custom-cursor");
    }

    const moveDotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3.out" });
    const moveDotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3.out" });
    const moveRingX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
    const moveRingY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

    function onMove(e: MouseEvent) {
      hideSystemCursor();
      gsap.set([dot, ring], { opacity: 1 });
      moveDotX(e.clientX);
      moveDotY(e.clientY);
      moveRingX(e.clientX);
      moveRingY(e.clientY);
    }

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const interactive = Boolean(target.closest("a, button, [role='button'], input, textarea"));
      gsap.to(ring, { scale: interactive ? 1.8 : 1, duration: 0.25, ease: "power3.out" });
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.body.classList.remove("cb-custom-cursor");
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-0"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent opacity-0"
      />
    </>
  );
}
