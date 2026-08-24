import { brandGradient, initials } from "@/lib/color";

export function BrandBadge({
  brand,
  size = "md",
}: {
  brand: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "w-8 h-8 text-[11px]" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-xs";
  return (
    <div
      className={`${dims} shrink-0 rounded-xl grid place-items-center font-bold text-white shadow-inner ring-1 ring-white/10`}
      style={{ background: brandGradient(brand) }}
      title={brand}
    >
      {initials(brand)}
    </div>
  );
}
