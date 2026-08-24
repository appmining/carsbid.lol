function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function brandHue(brand: string): number {
  return hashString(brand) % 360;
}

export function brandGradient(brand: string): string {
  const h = brandHue(brand);
  return `linear-gradient(135deg, hsl(${h} 70% 46%), hsl(${(h + 34) % 360} 75% 34%))`;
}

export function brandSolid(brand: string): string {
  const h = brandHue(brand);
  return `hsl(${h} 65% 52%)`;
}

export function initials(brand: string): string {
  const parts = brand.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
