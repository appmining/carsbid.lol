function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Backdrop for a model with no photograph.
 *
 *  Deliberately not a hash-derived hue. The old version rolled a random colour
 *  off the brand name — Audi purple, BMW green — which meant nothing, matched
 *  no real brand identity, and put neon rectangles next to photographs on a
 *  near-black panel. These stay inside the panel's own warm range and vary only
 *  in lightness, just enough that a grid of them doesn't read as one flat block. */
export function brandPlate(brand: string): string {
  const step = hashString(brand) % 5;
  const base = 7 + step;
  return `linear-gradient(160deg, hsl(35 9% ${base + 3}%), hsl(30 10% ${base}%))`;
}

export function initials(brand: string): string {
  const parts = brand.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
