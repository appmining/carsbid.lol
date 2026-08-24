"use client";

import { useState } from "react";
import Image from "next/image";
import { CAR_IMAGES } from "@/data/carImages.generated";
import { brandPlate, initials } from "@/lib/color";

/** Shown when a model has no photograph — most of the catalogue tail.
 *
 *  It reads as a type plate on the same dark panel as everything else rather
 *  than a coloured hole in the grid, so a row of photos and placeholders still
 *  looks like one surface. */
function PlatePlaceholder({
  brand,
  model,
  compact,
  className,
}: {
  brand: string;
  model: string;
  compact: boolean;
  className: string;
}) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden border-border-soft ${className}`}
      style={{ background: brandPlate(brand) }}
    >
      {compact ? (
        <span className="font-mono-tab text-[11px] font-bold text-accent/70">
          {initials(brand)}
        </span>
      ) : (
        <span className="px-3 text-center">
          <span className="block font-mono-tab text-eyebrow font-bold uppercase text-accent/70">
            {brand}
          </span>
          <span className="mt-0.5 block truncate text-xs font-medium text-text-dim">
            {model}
          </span>
        </span>
      )}
    </div>
  );
}

export function CarPhoto({
  slug,
  brand,
  model = "",
  alt = "",
  variant = "wide",
  className = "",
  compactFallback,
  sizes = "160px",
  priority = false,
}: {
  slug: string;
  brand: string;
  model?: string;
  /** Leave empty only where the photo repeats one already described nearby. */
  alt?: string;
  /** `wide` is 16:9 for tiles and heroes; `square` is 1:1 for avatars and rows.
   *  One wide photo squeezed into a 40px square left an unreadable sliver. */
  variant?: "wide" | "square";
  className?: string;
  /** Force initials-only placeholder; defaults to true for square. */
  compactFallback?: boolean;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const image = CAR_IMAGES[slug];
  const src = image ? image[variant] : null;

  if (!src || failed) {
    return (
      <PlatePlaceholder
        brand={brand}
        model={model}
        compact={compactFallback ?? variant === "square"}
        className={className}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function carHasPhoto(slug: string): boolean {
  return Boolean(CAR_IMAGES[slug]);
}

export function getCarImageCredit(slug: string) {
  return CAR_IMAGES[slug] ?? null;
}
