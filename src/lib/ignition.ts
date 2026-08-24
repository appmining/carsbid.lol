import { prefersReducedMotion } from "@/lib/motion";

const IGNITION_KEY = "carsbid_ignited";

/** Whether the ignition sequence should play, claimed once per browser tab.
 *
 *  A startup ceremony you sit through on every navigation stops being one and
 *  becomes an obstacle, so the first load in a tab gets it and the rest do not.
 *  Must be called from an effect, never during render — it touches
 *  sessionStorage, which the server does not have. */
export function claimIgnition(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  try {
    if (window.sessionStorage.getItem(IGNITION_KEY)) return false;
    window.sessionStorage.setItem(IGNITION_KEY, "1");
    return true;
  } catch {
    // Private mode and blocked storage both throw; the page is fine without
    // the ceremony, so treat it as already spent.
    return false;
  }
}
