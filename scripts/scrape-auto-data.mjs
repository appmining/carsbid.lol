// Pulls body type, production years and generation count for each catalogue
// model from auto-data.net.
//
//   node scripts/scrape-auto-data.mjs [--limit 800]
//
// auto-data.net's robots.txt allows `User-agent: *`, which is not a licence to
// hammer it: requests are spaced at least a second apart and every brand is
// checkpointed, so an interrupted run resumes instead of starting over.
//
// The model page carries body type and years but NOT fuel — that comes from
// scrape-powertrain.mjs, which uses the site's own search filters.

import * as cheerio from "cheerio";
import { fetchText, requestCounts } from "./lib/http.mjs";
import { matchKey } from "./lib/slug.mjs";
import { readCatalog, applyLimit } from "./lib/catalog.mjs";
import { loadStore, saveStore } from "./lib/store.mjs";

const BASE = "https://www.auto-data.net";
const OUT = "auto-data.json";
const BRANDS_CACHE = "auto-data-brands.json";
const CHECKPOINT_EVERY = 20;

/** `2020 - 2025 SUV, CrossoverPower: from 204 to 534 Hp | Dimensions: …` */
const GEN_RE = /^(\d{4})\s*-\s*(\d{4})?\s*(.+?)(?:Power\s*:|Dimensions\s*:|$)/;

async function loadBrandIndex() {
  const cached = await loadStore(BRANDS_CACHE);
  if (Object.keys(cached).length) return cached;

  const $ = cheerio.load(await fetchText(`${BASE}/en/allbrands`));
  const index = {};
  $('a[href*="-brand-"]').each((_, el) => {
    const href = $(el).attr("href");
    const name = $(el).text().trim();
    const id = Number(/-brand-(\d+)/.exec(href ?? "")?.[1]);
    if (!href || !name || !Number.isFinite(id)) return;
    const key = matchKey(name);
    // "Audi" (41) and "AUDI" (355, a separate Chinese joint venture) collapse to
    // the same key. The lower id is the established marque; without this the JV
    // won and every Audi in the catalogue failed to match.
    const existing = index[key];
    if (!existing || id < existing.id) index[key] = { href, name, id };
  });
  await saveStore(BRANDS_CACHE, index);
  return index;
}

/** brand page → { matchKey(model): href } */
async function loadBrandModels(brandHref, cache) {
  if (cache[brandHref]) return cache[brandHref];

  const $ = cheerio.load(await fetchText(BASE + brandHref));
  const models = {};
  $('a[href*="-model-"]').each((_, el) => {
    const href = $(el).attr("href");
    // The link text is "Clio\n\t\t\t2005 - 2012"; only the first line is the name.
    const label = $(el).text().replace(/\s+/g, " ").trim().split(/\s+\d{4}\s*-/)[0].trim();
    if (href && label && /-model-\d+/.test(href)) {
      const key = matchKey(label);
      if (key && !models[key]) models[key] = href;
    }
  });
  cache[brandHref] = models;
  return models;
}

/** Names to try for one catalogue model, most specific first.
 *
 *  The catalogue uses Turkish market names — "BMW 3 Serisi", "Mercedes-Benz
 *  C-Serisi" — while auto-data.net lists "3 Series" and "C-Class". It also
 *  sometimes repeats the brand in the model ("Mini Cooper" vs "Cooper"). */
function candidateKeys(car) {
  const raw = car.model;
  const variants = new Set([raw]);
  variants.add(raw.replace(/\bSerisi\b/gi, "Series"));
  variants.add(raw.replace(/\bSerisi\b/gi, "Class"));
  variants.add(raw.replace(/\bS[ıi]n[ıi]f[ıi]\b/gi, "Class"));
  // "Mini Cooper" → "Cooper"
  const brandPrefix = new RegExp(`^${car.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
  for (const v of [...variants]) variants.add(v.replace(brandPrefix, ""));
  return [...variants].map(matchKey).filter(Boolean);
}

function parseGenerations(html) {
  const $ = cheerio.load(html);
  const byHref = new Map();
  $('a[href*="-generation-"]').each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!href) return;
    // Each generation is linked twice: once by name, once by the detail line.
    // The detail line is the longer one and the only one starting with a year.
    const previous = byHref.get(href);
    if (!previous || text.length > previous.length) byHref.set(href, text);
  });

  const generations = [];
  for (const text of byHref.values()) {
    const m = GEN_RE.exec(text);
    if (!m) continue;
    const bodies = m[3]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s.length < 30);
    if (!bodies.length) continue;
    generations.push({ from: Number(m[1]), to: m[2] ? Number(m[2]) : null, bodies });
  }
  return generations;
}

async function main() {
  const all = await readCatalog();
  const cars = applyLimit(all);
  console.log(`Catalogue: ${cars.length} of ${all.length} models`);

  const brandIndex = await loadBrandIndex();
  console.log(`auto-data.net brands: ${Object.keys(brandIndex).length}`);

  const out = await loadStore(OUT);
  const brandModelCache = await loadStore("auto-data-brand-models.json");
  const unmatched = [];
  let done = 0;
  let fetched = 0;

  for (const car of cars) {
    if (out[car.slug]) { done++; continue; }

    const brand = brandIndex[matchKey(car.brand)];
    if (!brand) { unmatched.push({ ...car, reason: "brand not on auto-data.net" }); continue; }

    let models;
    try {
      models = await loadBrandModels(brand.href, brandModelCache);
    } catch (err) {
      unmatched.push({ ...car, reason: `brand page failed: ${err.message}` });
      continue;
    }

    const modelHref = candidateKeys(car).map((k) => models[k]).find(Boolean);
    if (!modelHref) { unmatched.push({ ...car, reason: "model not on brand page" }); continue; }

    try {
      const generations = parseGenerations(await fetchText(BASE + modelHref));
      if (!generations.length) {
        unmatched.push({ ...car, reason: "no generations parsed", href: modelHref });
        continue;
      }
      // Store how often each body type appears rather than picking one here.
      // Taking the newest generation gets it badly wrong: the Duster's newest
      // entry is a 2025 pick-up variant, the Passat's is an estate. The policy
      // for collapsing this into one body type lives in build-catalog.mjs.
      generations.sort((a, b) => b.from - a.from);
      const newest = generations[0].from;
      const bodyCounts = {};
      for (const g of generations) {
        // A generation from the last decade counts double — a nameplate that
        // moved from saloon to SUV should read as an SUV today.
        const recency = g.from >= newest - 10 ? 2 : 1;
        g.bodies.forEach((b, i) => {
          // auto-data lists the primary body first ("Sedan, Station wagon"),
          // so a secondary estate variant should not outvote the saloon the
          // nameplate actually is. Without this the Taycan came out an estate.
          const weight = recency * (i === 0 ? 3 : 1);
          bodyCounts[b] = (bodyCounts[b] ?? 0) + weight;
        });
      }
      out[car.slug] = {
        source: modelHref,
        bodyCounts,
        newestBodies: generations[0].bodies,
        from: Math.min(...generations.map((g) => g.from)),
        to: generations.some((g) => g.to === null) ? null : Math.max(...generations.map((g) => g.to)),
        generations: generations.length,
      };
      fetched++;
    } catch (err) {
      unmatched.push({ ...car, reason: `model page failed: ${err.message}` });
      continue;
    }

    done++;
    if (fetched % CHECKPOINT_EVERY === 0) {
      await saveStore(OUT, out);
      await saveStore("auto-data-brand-models.json", brandModelCache);
      console.log(`  … ${done}/${cars.length} resolved (${fetched} fetched this run)`);
    }
  }

  await saveStore(OUT, out);
  await saveStore("auto-data-brand-models.json", brandModelCache);
  await saveStore("auto-data-unmatched.json", unmatched);

  console.log(`\nResolved ${Object.keys(out).length} models, ${unmatched.length} unmatched`);
  console.log(`Requests this run: ${JSON.stringify(requestCounts())}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
