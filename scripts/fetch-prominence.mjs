// Scores how well known each model is, using Wikipedia pageviews.
//
//   node scripts/fetch-prominence.mjs [--limit 800]
//
// This exists because the catalogue has no popularity signal at all. cars.ts
// claims "Zipf-like decay applied below" but no such code was ever written, so
// with an empty vote table the ranking falls back to raw array order — which
// past the curated head is just alphabetical. That is why the Sports tab opens
// with AC Ace, AC Aceca, AC Cobra and buries the Ferrari 488 at #206.
//
// Both en and tr are queried: Fiat Egea scores only 834 on en.wikipedia because
// the article lives under "Fiat Tipo", and demoting Turkey's best-selling car
// would be the opposite of the point.

import { fetchJson, requestCounts, sleep } from "./lib/http.mjs";
import { readCatalog, applyLimit } from "./lib/catalog.mjs";
import { loadStore, saveStore } from "./lib/store.mjs";

const OUT = "prominence.json";
const WIKIS = ["en", "tr"];
const FROM = "2025080100";
const TO = "2026080100";
const CHECKPOINT_EVERY = 50;

async function resolveTitle(wiki, query) {
  const qs = new URLSearchParams({
    action: "query", generator: "search", gsrsearch: query, gsrlimit: "1",
    prop: "info", format: "json", origin: "*",
  });
  const data = await fetchJson(`https://${wiki}.wikipedia.org/w/api.php?${qs}`, { minIntervalMs: 120 });
  const pages = data?.query?.pages;
  if (!pages) return null;
  return Object.values(pages)[0]?.title ?? null;
}

async function views(wiki, title) {
  const encoded = encodeURIComponent(title.replaceAll(" ", "_"));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${wiki}.wikipedia/all-access/user/${encoded}/monthly/${FROM}/${TO}`;
  try {
    const data = await fetchJson(url, { minIntervalMs: 120, retries: 2 });
    return (data.items ?? []).reduce((sum, item) => sum + item.views, 0);
  } catch {
    return 0;   // no pageview data for this article
  }
}

async function main() {
  const cars = applyLimit(await readCatalog());
  const out = await loadStore(OUT);
  let done = 0;

  for (const car of cars) {
    if (out[car.slug]) { done++; continue; }
    const query = `${car.brand} ${car.model}`;
    const entry = { titles: {}, views: {}, total: 0 };

    for (const wiki of WIKIS) {
      try {
        const title = await resolveTitle(wiki, query);
        if (!title) continue;
        entry.titles[wiki] = title;
        entry.views[wiki] = await views(wiki, title);
      } catch {
        // A wiki that fails just contributes nothing; the other still counts.
      }
    }
    // Turkish views are weighted up: this is a Turkish-market site, and a model
    // that is big here matters more than one that is big on en.wikipedia.
    entry.total = (entry.views.en ?? 0) + (entry.views.tr ?? 0) * 8;
    out[car.slug] = entry;

    done++;
    if (done % CHECKPOINT_EVERY === 0) {
      await saveStore(OUT, out);
      console.log(`  … ${done}/${cars.length}`);
    }
    await sleep(40);
  }

  await saveStore(OUT, out);
  const ranked = Object.entries(out).sort((a, b) => b[1].total - a[1].total);
  console.log(`\nScored ${ranked.length} models. Top 10:`);
  for (const [slug, e] of ranked.slice(0, 10)) {
    console.log(`  ${slug.padEnd(26)} ${String(e.total).padStart(9)}  (en ${e.views.en ?? 0} / tr ${e.views.tr ?? 0})`);
  }
  console.log(`Requests this run: ${JSON.stringify(requestCounts())}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
