import type { MetadataRoute } from "next";
import { CARS } from "@/data/cars.generated";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

const STATIC_PATHS = ["", "/patronlar", "/hakkinda", "/kurallar"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  // Each URL declares its siblings in the other locales, so the three language
  // versions are understood as translations rather than duplicates.
  const alternatesFor = (path: string) => ({
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, `${base}/${l}${path}`])
    ),
  });

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${base}/${locale}${path}`,
        changeFrequency: path === "" ? "daily" : "monthly",
        priority: path === "" ? 1 : 0.5,
        alternates: alternatesFor(path),
      });
    }
    for (const car of CARS) {
      const path = `/araba/${car.slug}`;
      entries.push({
        url: `${base}/${locale}${path}`,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: alternatesFor(path),
      });
    }
  }

  return entries;
}
