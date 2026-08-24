/** Single source for the reduced-motion check.
 *
 *  Deliberately does NOT also treat `document.hidden` as reduced motion. These
 *  animations run once on mount and never re-check, so a page opened in a
 *  background tab would have its entrance permanently skipped — by the time the
 *  visitor switches to it, everything has already decided not to animate.
 *  ScrollTrigger and IntersectionObserver already hold offscreen work back. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
