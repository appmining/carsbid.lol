// Builds the car photo set from Wikipedia/Wikimedia (CC-licensed, attributed).
//
//   node scripts/fetch-car-images.mjs --limit 800 --target supabase
//   node scripts/fetch-car-images.mjs --limit 30  --target local    # no creds needed
//
// Two things the previous version got wrong, both visible on the live site:
//
//   1. It trusted `gsrlimit=1` blindly, so whatever Wikipedia's search returned
//      first became the car. That put a Renault Kwid on `dacia-spring`, a Sehol
//      E40X on `jac-js4`, and in sampling returned a Ford Festiva for "Kia
//      Roadster". Every candidate is now verified against the brand name.
//
//   2. It shipped one wide photo and let object-cover squeeze it into every
//      box, including 40px squares where the car became an unreadable sliver.
//      Two purpose-built derivatives are generated instead.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fetchJson, politeFetch, requestCounts, sleep } from "./lib/http.mjs";
import { normalize } from "./lib/slug.mjs";
import { readCatalog, applyLimit, ROOT } from "./lib/catalog.mjs";
import { loadStore, saveStore } from "./lib/store.mjs";

const OUT = "images.json";
const REJECTS = "image-rejects.json";
const MIN_SOURCE_WIDTH = 1200;
const CHECKPOINT_EVERY = 20;

// Sized to the largest box each derivative actually lands in, doubled for
// retina — not to whatever the source happened to be.
const WIDE = { w: 1280, h: 720, quality: 74 };
const SQUARE = { w: 400, h: 400, quality: 76 };

// Turkish-market names that differ from the international article title.
const QUERY_OVERRIDES = {
  "fiat-egea": "Fiat Tipo (2015)",
  "renault-taliant": "Renault Taliant",
  "dacia-spring": "Dacia Spring",
  "gwm-haval-h6": "Haval H6",
  "gwm-haval-dargo": "Haval Dargo",
  "omoda-5": "Omoda C5",
  "togg-t10x": "Togg T10X",
  "togg-t10f": "Togg T10F",
  // Wikipedia's free-text search resolves the Mercedes classes to whichever
  // chassis-code article ranks highest — "A-Serisi" landed on the W116, which
  // is a 1972 S-Class. These are top-selling nameplates here, so they are
  // pinned rather than searched.
  "mercedes-benz-a-serisi": "Mercedes-Benz A-Class",
  "mercedes-benz-b-serisi": "Mercedes-Benz B-Class",
  "mercedes-benz-c-serisi": "Mercedes-Benz C-Class",
  "mercedes-benz-e-serisi": "Mercedes-Benz E-Class",
  "mercedes-benz-s-serisi": "Mercedes-Benz S-Class",
  "mercedes-benz-g-serisi": "Mercedes-Benz G-Class",
  "bmw-1-serisi": "BMW 1 Series",
  "bmw-2-serisi": "BMW 2 Series",
  "bmw-3-serisi": "BMW 3 Series",
  "bmw-4-serisi": "BMW 4 Series",
  "bmw-5-serisi": "BMW 5 Series",
  "bmw-7-serisi": "BMW 7 Series",
};

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
};

/** Reject a candidate whose article clearly is not this manufacturer's car.
 *
 *  Checked against the query that was actually used, not the catalogue name:
 *  searching "BMW 3 Series" and then demanding the word "Serisi" appear in the
 *  result rejected the correct article every time. */
function verify(car, page, query) {
  const title = normalize(page.title ?? "");
  const extract = normalize(page.extract ?? "").slice(0, 400);
  const brandTokens = normalize(car.brand).split(/[^a-z0-9]+/).filter((t) => t.length > 1);

  // Any token is enough: "GWM Haval Jolion" lives under "Haval Jolion", and
  // requiring the parent group's name would reject the correct article.
  const brandOk = brandTokens.some((t) => title.includes(t) || extract.includes(t));
  if (!brandOk) return `brand "${car.brand}" absent from "${page.title}"`;

  const brandSet = new Set(brandTokens);
  const modelTokens = normalize(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !brandSet.has(t));
  if (modelTokens.length) {
    const modelOk = modelTokens.some((t) => title.includes(t) || extract.includes(t));
    if (!modelOk) return `model "${car.model}" absent from "${page.title}"`;
  }
  return null;
}

/** Wikipedia titles these in English; the catalogue uses Turkish market names.
 *  Without this the BMW 3 Series and every Mercedes class — some of the most
 *  searched models in the country — came back with no usable photo at all. */
function searchQueries(car) {
  if (QUERY_OVERRIDES[car.slug]) return [QUERY_OVERRIDES[car.slug]];
  const queries = new Set([`${car.brand} ${car.model}`]);
  const model = car.model;
  if (/serisi/i.test(model)) {
    queries.add(`${car.brand} ${model.replace(/\bSerisi\b/gi, "Series")}`);
    queries.add(`${car.brand} ${model.replace(/[-\s]?Serisi\b/gi, "-Class")}`);
  }
  if (/s[ıi]n[ıi]f[ıi]/i.test(model)) {
    queries.add(`${car.brand} ${model.replace(/[-\s]?S[ıi]n[ıi]f[ıi]\b/gi, "-Class")}`);
  }
  // "GWM Haval Jolion" is listed under the marque, not the parent group.
  const words = car.brand.split(/\s+/);
  if (words.length > 1) queries.add(`${words.slice(1).join(" ")} ${model}`);
  if (/^GWM /i.test(car.brand)) queries.add(model);
  return [...queries];
}

async function findCandidate(car) {
  const problems = [];
  for (const query of searchQueries(car)) {
    const result = await searchOnce(car, query);
    if (result.page) return result;
    problems.push(result.reason);
  }
  return { reason: problems[problems.length - 1] ?? "no usable candidate" };
}

async function searchOnce(car, query) {
  const qs = new URLSearchParams({
    action: "query", generator: "search", gsrsearch: query, gsrlimit: "3",
    prop: "pageimages|extracts|info", piprop: "original|thumbnail",
    pithumbsize: "1600", exintro: "1",
    explaintext: "1", exchars: "400", inprop: "url", format: "json",
  });
  const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${qs}`, { minIntervalMs: 150 });
  const pages = Object.values(data?.query?.pages ?? {});
  if (!pages.length) return { reason: "no search result" };

  const problems = [];
  for (const page of pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))) {
    const problem = verify(car, page, query);
    if (problem) { problems.push(problem); continue; }
    if (!page.original?.source) { problems.push(`"${page.title}" has no image`); continue; }
    if (page.original.width < MIN_SOURCE_WIDTH) {
      // Guard on the original's true size — the thumbnail is upscaled from it
      // and a 530px source cannot fill a 1280px derivative.
      problems.push(`"${page.title}" only ${page.original.width}px wide`);
      continue;
    }
    return { page };
  }
  return { reason: problems[problems.length - 1] ?? "no usable candidate" };
}

/** MediaWiki normalises "File:A_B.jpg" to "File:A B.jpg" in its response, so
 *  both sides of the lookup are keyed on the spaced form. Keying on the
 *  underscored request title silently missed every single credit. */
const creditKey = (title) => title.replaceAll("_", " ");

async function attributionFor(titles) {
  const out = {};
  for (let i = 0; i < titles.length; i += 40) {
    const qs = new URLSearchParams({
      action: "query", titles: titles.slice(i, i + 40).join("|"),
      prop: "imageinfo", iiprop: "extmetadata", format: "json",
    });
    // Commons is where these files actually live; en.wikipedia answers too but
    // reports them as "missing", which is easy to misread as a failure.
    const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${qs}`, { minIntervalMs: 150 });
    for (const page of Object.values(data?.query?.pages ?? {})) {
      const meta = page.imageinfo?.[0]?.extmetadata ?? {};
      const strip = (v) => (v ? String(v).replace(/<[^>]*>/g, "").trim() : null);
      out[creditKey(page.title)] = {
        artist: strip(meta.Artist?.value),
        license: strip(meta.LicenseShortName?.value),
        licenseUrl: strip(meta.LicenseUrl?.value),
      };
    }
  }
  return out;
}

async function derive(buffer) {
  const base = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const wide = await base
    .clone().resize(WIDE.w, WIDE.h, { fit: "cover", position: "attention" })
    .jpeg({ quality: WIDE.quality, mozjpeg: true }).toBuffer();
  // "attention" rather than centre: these are street photographs where the car
  // is rarely dead centre, and a centre crop of a 2.3:1 shot into a square lost
  // most of the vehicle.
  const square = await base
    .clone().resize(SQUARE.w, SQUARE.h, { fit: "cover", position: "attention" })
    .jpeg({ quality: SQUARE.quality, mozjpeg: true }).toBuffer();
  const blurBuf = await base
    .clone().resize(16, 9, { fit: "cover" }).jpeg({ quality: 40 }).toBuffer();
  return {
    wide, square,
    blurDataURL: `data:image/jpeg;base64,${blurBuf.toString("base64")}`,
    sourceWidth: meta.width, sourceHeight: meta.height,
  };
}

function makeUploader(target) {
  if (target === "local") {
    const dir = path.join(ROOT, "public", "car-photos");
    return {
      async init() { await mkdir(dir, { recursive: true }); },
      async put(slug, variant, buffer) {
        await writeFile(path.join(dir, `${slug}-${variant}.jpg`), buffer);
        return `/car-photos/${slug}-${variant}.jpg`;
      },
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
    throw new Error(
      "Supabase upload needs real NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
      "in .env.local, plus a public bucket named 'car-photos'. " +
      "Use --target local to build derivatives without uploading."
    );
  }
  return {
    async init() {
      const { createClient } = await import("@supabase/supabase-js");
      this.client = createClient(url, key, { auth: { persistSession: false } });
    },
    async put(slug, variant, buffer) {
      const key = `${slug}/${variant}.jpg`;
      const { error } = await this.client.storage
        .from("car-photos")
        .upload(key, buffer, { contentType: "image/jpeg", upsert: true });
      if (error) throw new Error(`upload ${key}: ${error.message}`);
      return `${url}/storage/v1/object/public/car-photos/${key}`;
    },
  };
}

async function main() {
  const cars = applyLimit(await readCatalog());
  const target = arg("--target", "local");
  const uploader = makeUploader(target);
  await uploader.init();
  console.log(`Fetching photos for ${cars.length} models → ${target}`);

  const out = await loadStore(OUT);
  const rejects = [];
  const fileTitles = new Map();
  let added = 0;

  for (const car of cars) {
    if (out[car.slug]) continue;

    let candidate;
    try {
      candidate = await findCandidate(car);
    } catch (err) {
      rejects.push({ slug: car.slug, name: `${car.brand} ${car.model}`, reason: `search failed: ${err.message}` });
      continue;
    }
    if (!candidate.page) {
      rejects.push({ slug: car.slug, name: `${car.brand} ${car.model}`, reason: candidate.reason });
      continue;
    }

    const page = candidate.page;
    try {
      // Download the 1600px thumbnail, not the original: originals run to
      // 6 MB of 4000px photograph and the widest derivative is 1280.
      const source = page.thumbnail?.source ?? page.original.source;
      const res = await politeFetch(source, { minIntervalMs: 200, accept: "image/*" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const d = await derive(buffer);

      const wideUrl = await uploader.put(car.slug, "wide", d.wide);
      const squareUrl = await uploader.put(car.slug, "square", d.square);

      out[car.slug] = {
        wide: wideUrl,
        square: squareUrl,
        width: WIDE.w,
        height: WIDE.h,
        blurDataURL: d.blurDataURL,
        sourcePageUrl: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        sourcePageTitle: page.title,
        artist: null, license: null, licenseUrl: null,
      };
      // Strip the query string first: the API now appends utm_* params to
      // image URLs, and they were ending up inside the File: title, which made
      // every attribution lookup miss and every credit come back null.
      const fileName = page.original.source.split("/").pop().split("?")[0];
      const fileTitle = decodeURIComponent(fileName);
      fileTitles.set(car.slug, `File:${fileTitle}`);
      added++;
      if (added % CHECKPOINT_EVERY === 0) {
        await saveStore(OUT, out);
        console.log(`  … ${added} fetched, ${rejects.length} rejected`);
      }
    } catch (err) {
      rejects.push({ slug: car.slug, name: `${car.brand} ${car.model}`, reason: `image failed: ${err.message}` });
    }
    await sleep(60);
  }

  // Attribution is a licence obligation, not a nicety — fill it for everything
  // fetched in this run.
  const titles = [...new Set(fileTitles.values())];
  if (titles.length) {
    const credits = await attributionFor(titles);
    let credited = 0;
    for (const [slug, title] of fileTitles) {
      const c = credits[creditKey(title)];
      if (c && out[slug]) { Object.assign(out[slug], c); if (c.artist) credited++; }
    }
    console.log(`Attribution resolved for ${credited}/${fileTitles.size} new photos`);
    if (credited === 0) {
      console.warn("WARNING: no attribution resolved — these are CC-licensed photos and credit is a licence condition, not a nicety.");
    }
  }

  await saveStore(OUT, out);
  await saveStore(REJECTS, rejects);

  const body = Object.entries(out)
    .map(([slug, v]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(v, null, 4).replace(/\n/g, "\n  ")},`)
    .join("\n");
  await writeFile(path.join(ROOT, "src", "data", "carImages.generated.ts"),
`// AUTO-GENERATED by scripts/fetch-car-images.mjs — do not edit by hand.
// Photos come from Wikipedia/Wikimedia Commons and stay under their original
// licences; each entry carries its source page and attribution.
import type { CarImage } from "@/lib/types";

export const CAR_IMAGES: Record<string, CarImage> = {
${body}
};
`);

  console.log(`\n${Object.keys(out).length} photos, ${rejects.length} rejected this run`);
  if (rejects.length) {
    console.log("Rejections (see scripts/data/image-rejects.json):");
    for (const r of rejects.slice(0, 10)) console.log(`  ${r.name} — ${r.reason}`);
  }
  console.log(`Requests this run: ${JSON.stringify(requestCounts())}`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
