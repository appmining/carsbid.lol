"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsapConfig";

export function ScrollReveal({
  children,
  className = "",
  y = 22,
  stagger = 0,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const reduced =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;
      const targets = stagger > 0 ? gsap.utils.toArray(ref.current.children) : ref.current;
      if (reduced) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: stagger || 0,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
