// Merges the scraped caches into src/data/cars.generated.ts.
//
//   node scripts/build-catalog.mjs
//
// cars.ts stays the hand-edited source of model identity and of the curated
// Turkish-market ordering. This script only enriches it, so re-running is
// always safe and nothing hand-written is ever overwritten.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { readCatalog, ROOT } from "./lib/catalog.mjs";
import { loadStore } from "./lib/store.mjs";

// How far into cars.ts the deliberately curated Turkish-market ordering runs.
// Past this point the catalogue is an alphabetical brand dump.
const CURATED_HEAD = 250;

// auto-data.net body labels → our tabs.
const BODY_MAP = {
  "SUV": "suv", "Crossover": "suv", "CUV": "suv", "SAV": "suv", "SAC": "suv",
  "Coupe": "spor", "Roadster": "spor", "Targa": "spor", "Grand Tourer": "spor",
  "Cabriolet": "spor", "Coupe - Cabriolet": "spor",
  "Minivan": "mpv", "MPV": "mpv", "Van": "mpv",
  "Off-road vehicle": "offroad",
  "Pick-up": "pickup",
  "Sedan": "sedan", "Fastback": "sedan", "Liftback": "sedan",
  "Hatchback": "hatchback",
  "Station wagon (estate)": "sedan",
  "Quadricycle": "hatchback",
};

// The hand-assigned segment values that are genuinely body types.
const HAND_BODY = new Set(["sedan", "hatchback", "suv", "pickup", "mpv", "spor", "offroad"]);

/** Collapse the weighted body-type census into one tab. */
function bodyFromCounts(counts) {
  const tally = {};
  for (const [label, n] of Object.entries(counts)) {
    const mapped = BODY_MAP[label];
    if (mapped) tally[mapped] = (tally[mapped] ?? 0) + n;
  }
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;

  return ranked[0][0];
}

function chooseBody(car, scraped) {
  const scrapedBody = scraped ? bodyFromCounts(scraped.bodyCounts ?? {}) : null;

  // Inside the curated head the hand-assigned value wins, because it encodes
  // what the model is *in Turkey*. auto-data.net's global generation census
  // calls the Egea a hatchback and the Passat an estate — true worldwide,
  // wrong for this audience. Past the head there is no such judgement to keep.
  if (car.index < CURATED_HEAD && HAND_BODY.has(car.segment)) return car.segment;
  return scrapedBody ?? (HAND_BODY.has(car.segment) ? car.segment : "sedan");
}

function main() {
  return Promise.all([
    readCatalog(),
    loadStore("auto-data.json"),
    loadStore("powertrain.json"),
    loadStore("prominence.json"),
  ]).then(async ([cars, autoData, powertrain, prominence]) => {
    const maxViews = Math.max(1, ...Object.values(prominence).map((p) => p.total ?? 0));

    const enriched = cars.map((car) => {
      const scraped = autoData[car.slug];
      const kinds = new Set(powertrain[car.slug] ?? []);
      // A nameplate that predates the EV era and ran for several generations is
      // a combustion car that later gained an electric variant — the Ford Focus
      // had a Focus Electric, but filtering "electric" and being shown a Focus
      // reads as a broken filter. Those keep "ice" alongside.
      const legacy = scraped && scraped.from < 2010 && scraped.generations > 2;
      if (legacy || kinds.size === 0) kinds.add("ice");
      const power = [...kinds].sort();
      const views = prominence[car.slug]?.total ?? 0;

      return {
        slug: car.slug,
        brand: car.brand,
        model: car.model,
        body: chooseBody(car, scraped),
        powertrain: power,
        years: scraped ? [scraped.from, scraped.to] : null,
        generations: scraped?.generations ?? 0,
        // Log scale: raw views span five orders of magnitude, and a linear
        // score would leave everything below the Corolla indistinguishable.
        prominence: views > 0 ? Math.log10(1 + views) / Math.log10(1 + maxViews) : 0,
        curated: car.index < CURATED_HEAD ? car.index : null,
      };
    });

    // Curated head keeps its hand-picked order; the tail sorts by how well
    // known each model is, so the Sports tab opens with the Ferrari rather
    // than the AC Ace.
    enriched.sort((a, b) => {
      if (a.curated !== null && b.curated !== null) return a.curated - b.curated;
      if (a.curated !== null) return -1;
      if (b.curated !== null) return 1;
      if (b.prominence !== a.prominence) return b.prominence - a.prominence;
      return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
    });

    // Emitted as tuples rather than object literals: at 3858 entries TypeScript
    // gives up trying to represent the union of the inlined literal types
    // ("Expression produces a union type that is too complex to represent").
    // One declared Row type sidesteps that, and halves the file.
    const rows = enriched.map((c) =>
      `  [${JSON.stringify(c.slug)}, ${JSON.stringify(c.brand)}, ${JSON.stringify(c.model)}, ` +
      `${JSON.stringify(c.body)}, ${JSON.stringify(c.powertrain)}, ` +
      `${c.years ? c.years[0] : 0}, ${c.years && c.years[1] !== null ? c.years[1] : 0}, ` +
      `${c.generations}, ${c.prominence.toFixed(4)}],`
    ).join("\n");

    const file = `// AUTO-GENERATED by scripts/build-catalog.mjs — do not edit by hand.
// Identity and the curated Turkish-market ordering come from src/data/cars.ts;
// body type, powertrain, years and generations come from auto-data.net; the
// prominence score comes from Wikipedia pageviews. Re-run the scripts in
// scripts/ to refresh.
import type { BodyType, CarModel, Powertrain } from "@/lib/types";

type Row = [
  slug: string,
  brand: string,
  model: string,
  body: BodyType,
  powertrain: Powertrain[],
  /** 0 when the production span is unknown. */
  from: number,
  /** 0 for "still in production" as well as unknown; from disambiguates. */
  to: number,
  generations: number,
  prominence: number,
];

const ROWS: Row[] = [
${rows}
];

export const CARS: CarModel[] = ROWS.map(
  ([slug, brand, model, body, powertrain, from, to, generations, prominence]) => ({
    slug,
    brand,
    model,
    body,
    powertrain,
    years: from ? [from, to || null] : null,
    generations,
    prominence,
  })
);

export const CARS_BY_SLUG: Record<string, CarModel> = Object.fromEntries(
  CARS.map((c) => [c.slug, c])
);

export const BRANDS: string[] = Array.from(new Set(CARS.map((c) => c.brand))).sort();

export function getCar(slug: string): CarModel | undefined {
  return CARS_BY_SLUG[slug];
}
`;

    await writeFile(path.join(ROOT, "src", "data", "cars.generated.ts"), file);

    const withBody = enriched.filter((c) => autoData[c.slug]).length;
    const evs = enriched.filter((c) => c.powertrain.includes("ev")).length;
    const hybrids = enriched.filter((c) => c.powertrain.includes("hybrid")).length;
    const scored = enriched.filter((c) => c.prominence > 0).length;
    const byBody = {};
    for (const c of enriched) byBody[c.body] = (byBody[c.body] ?? 0) + 1;

    console.log(`Wrote ${enriched.length} models to src/data/cars.generated.ts`);
    console.log(`  auto-data coverage : ${withBody}`);
    console.log(`  electric / hybrid  : ${evs} / ${hybrids}`);
    console.log(`  prominence scored  : ${scored}`);
    console.log(`  bodies             : ${JSON.stringify(byBody)}`);
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
