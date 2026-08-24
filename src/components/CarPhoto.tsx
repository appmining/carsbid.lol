"use client";

import { useState } from "react";
import Image from "next/image";
import { CAR_IMAGES } from "@/data/carImages.generated";
import { BrandBadge } from "@/components/BrandBadge";
import { brandGradient } from "@/lib/color";

function FallbackCard({
  brand,
  className,
  fallbackBadgeSize,
}: {
  brand: string;
  className: string;
  fallbackBadgeSize: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={`relative grid place-items-center ${className}`}
      style={{ background: brandGradient(brand) }}
    >
      <BrandBadge brand={brand} size={fallbackBadgeSize} />
    </div>
  );
}

export function CarPhoto({
  slug,
  brand,
  alt = "",
  className = "",
  fallbackBadgeSize = "md",
  sizes = "160px",
  priority = false,
}: {
  slug: string;
  brand: string;
  /** Leave empty only where the photo is decorative or repeats one already
   *  described nearby — otherwise name the model, e.g. "Fiat Egea". */
  alt?: string;
  className?: string;
  fallbackBadgeSize?: "sm" | "md" | "lg";
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const image = CAR_IMAGES[slug];

  if (!image || failed) {
    return (
      <FallbackCard brand={brand} className={className} fallbackBadgeSize={fallbackBadgeSize} />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
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
