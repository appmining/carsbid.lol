// Tags catalogue models with their powertrain using auto-data.net's own search
// filters.
//
//   node scripts/scrape-powertrain.mjs [--limit 800]
//
// Why not the model pages: they carry body type and years but no fuel at all.
// Why not the generation pages: that is ~11k extra requests.
//
// The results endpoint hard-caps at 504 rows (page 15 onwards just repeats the
// last page), so each fuel is sliced by body type, and any slice that still
// hits the cap is sliced again by power band. Only electric and hybrid are
// crawled — anything untagged is combustion, which is the safe default and
// keeps this to a few hundred requests.

import * as cheerio from "cheerio";
import { fetchText, requestCounts } from "./lib/http.mjs";
import { matchKey } from "./lib/slug.mjs";
import { readCatalog } from "./lib/catalog.mjs";
import { loadStore, saveStore } from "./lib/store.mjs";

const BASE = "https://www.auto-data.net/en/results";
const OUT = "powertrain.json";
const ROW_CAP = 504;      // observed hard ceiling on the results endpoint
const MAX_PAGES = 14;
const BODY_TYPES = Array.from({ length: 22 }, (_, i) => i + 1);
const POWER_BANDS = [[0, 120], [121, 200], [201, 320], [321, 550], [551, 2000]];

// fuel[] values, read off the site's own search form.
const FUELS = {
  ev: [6],                 // Electricity
  hybrid: [7, 8, 10, 12],  // petrol/diesel/E85/hydrogen + electricity
};

function rowsFrom(html) {
  const $ = cheerio.load(html);
  const hrefs = new Set();
  $('a[href^="/en/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/-\d{4,}$/.test(href)) hrefs.add(href);
  });
  return hrefs;
}

/** Walk a slice until it stops yielding new rows or hits the page ceiling. */
async function crawlSlice(params) {
  const found = new Set();
  let pages = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const qs = new URLSearchParams(params);
    qs.set("page", String(page));
    const before = found.size;
    for (const href of rowsFrom(await fetchText(`${BASE}?${qs}`))) found.add(href);
    pages = page;
    if (found.size === before) break;   // page repeated — end of the slice
  }
  return { found, pages, capped: found.size >= ROW_CAP };
}

async function main() {
  const cars = await readCatalog();
  // Compare with separators stripped. auto-data.net writes the ID.4 as
  // "volkswagen-id.4-…" while our slug is "volkswagen-id-4", so a plain prefix
  // match silently dropped the whole ID range from the electric filter.
  // Longest first so "bmw-ix3-long" still wins over "bmw-ix3".
  const compact = cars
    .map((c) => ({ slug: c.slug, key: matchKey(c.slug) }))
    .sort((a, b) => b.key.length - a.key.length);

  const out = await loadStore(OUT);
  const capped = [];

  const matchSlug = (href) => {
    const path = matchKey(href.replace(/^\/en\//, "").replace(/-\d{4,}$/, ""));
    return compact.find((c) => path.startsWith(c.key))?.slug;
  };

  const tag = (hrefs, kind) => {
    let hits = 0;
    for (const href of hrefs) {
      const slug = matchSlug(href);
      if (!slug) continue;
      const set = new Set(out[slug] ?? []);
      set.add(kind);
      out[slug] = [...set];
      hits++;
    }
    return hits;
  };

  for (const [kind, fuelValues] of Object.entries(FUELS)) {
    for (const fuel of fuelValues) {
      for (const body of BODY_TYPES) {
        const params = [["fuel[]", String(fuel)], ["coupe[]", String(body)]];
        const slice = await crawlSlice(params);
        if (!slice.found.size) continue;

        if (slice.capped) {
          // Slice again by power band so the 504 ceiling stops truncating.
          capped.push({ kind, fuel, body });
          for (const [lo, hi] of POWER_BANDS) {
            const sub = await crawlSlice([...params, ["power1", String(lo)], ["power2", String(hi)]]);
            for (const href of sub.found) slice.found.add(href);
          }
        }

        const hits = tag(slice.found, kind);
        if (hits) {
          console.log(`  ${kind} fuel=${fuel} body=${body}: ${slice.found.size} rows → ${hits} catalogue hits${slice.capped ? " (was capped, subdivided)" : ""}`);
          await saveStore(OUT, out);
        }
      }
    }
  }

  await saveStore(OUT, out);
  const evs = Object.values(out).filter((v) => v.includes("ev")).length;
  const hybrids = Object.values(out).filter((v) => v.includes("hybrid")).length;
  console.log(`\nTagged ${Object.keys(out).length} models — ${evs} electric, ${hybrids} hybrid`);
  if (capped.length) console.log(`Slices that hit the 504 cap and were subdivided: ${capped.length}`);
  console.log(`Requests this run: ${JSON.stringify(requestCounts())}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
