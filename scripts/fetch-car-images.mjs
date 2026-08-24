// One-off data fetch: pulls a representative photo + attribution per car
// model from Wikipedia (CC-licensed / public domain content) via the public
// MediaWiki API. Run with: node scripts/fetch-car-images.mjs
// Regenerates src/data/carImages.generated.ts — safe to re-run any time.

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, "../public/car-photos");

const UA = "carsbid.lol/1.0 (https://carsbidlol.vercel.app; contact: toyguncil1@gmail.com)";
const API = "https://en.wikipedia.org/w/api.php";

// Query overrides for models whose Turkish-market nameplate differs from
// the international Wikipedia article title, or that need disambiguation.
const QUERY_OVERRIDES = {
  "fiat-egea": "Fiat Egea",
  "bmw-3-serisi": "BMW 3 Series",
  "bmw-x1": "BMW X1",
  "bmw-x3": "BMW X3",
  "mercedes-benz-c-serisi": "Mercedes-Benz C-Class",
  "mercedes-benz-a-serisi": "Mercedes-Benz A-Class",
  "mercedes-benz-gla": "Mercedes-Benz GLA",
  "mercedes-benz-glc": "Mercedes-Benz GLC",
  "renault-taliant": "Dacia Logan",
  "renault-broadway": "Dacia Logan",
  "chery-tiggo-4-pro": "Chery Tiggo 4",
  "audi-a3": "Audi A3",
  "audi-q3": "Audi Q3",
  "audi-q5": "Audi Q5",
  "citroen-c3": "Citroën C3",
  "citroen-c4-cactus": "Citroën C4 Cactus",
  "skoda-octavia": "Škoda Octavia",
  "skoda-fabia": "Škoda Fabia",
  "omoda-5": "Omoda 5",
  "karsan-jest": "Karsan Jest",
  "jac-t8": "JAC T8",
  "togg-t10x": "Togg T10X",
  "togg-t10f": "Togg T10F",
  "mercedes-benz-e-serisi": "Mercedes-Benz E-Class",
  "mercedes-benz-s-serisi": "Mercedes-Benz S-Class",
  "skoda-kamiq": "Škoda Kamiq",
  "skoda-karoq": "Škoda Karoq",
  "skoda-kodiaq": "Škoda Kodiaq",
  "skoda-superb": "Škoda Superb",
  "skoda-enyaq": "Škoda Enyaq",
  "gwm-haval-h6": "Haval H6",
  "gwm-haval-dargo": "Haval Dargo",
  "gwm-haval-jolion": "Haval Jolion",
  "dacia-spring": "Dacia Spring",
};

async function wikiGet(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    format: "json",
    origin: "*",
    ...params,
  }).toString();
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function searchCarImage(slug, brand, model) {
  const query = QUERY_OVERRIDES[slug] ?? `${brand} ${model}`;
  const data = await wikiGet({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "1",
    prop: "pageimages|info",
    pithumbsize: "640",
    inprop: "url",
  });
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (!page?.thumbnail?.source) return null;
  return {
    slug,
    query,
    pageTitle: page.title,
    pageUrl: page.fullurl,
    thumbUrl: page.thumbnail.source,
    thumbWidth: page.thumbnail.width,
    thumbHeight: page.thumbnail.height,
    imageFile: page.pageimage ? `File:${page.pageimage}` : null,
  };
}

async function fetchAttribution(fileTitles) {
  const out = {};
  for (let i = 0; i < fileTitles.length; i += 40) {
    const chunk = fileTitles.slice(i, i + 40);
    const data = await wikiGet({
      action: "query",
      titles: chunk.join("|"),
      prop: "imageinfo",
      iiprop: "extmetadata",
    });
    const pages = data.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      const meta = page.imageinfo?.[0]?.extmetadata;
      if (!meta) continue;
      out[page.title] = {
        artist: stripHtml(meta.Artist?.value),
        license: meta.LicenseShortName?.value ?? null,
        licenseUrl: meta.LicenseUrl?.value ?? null,
      };
    }
  }
  return out;
}

function stripHtml(s) {
  if (!s) return null;
  return s.replace(/<[^>]+>/g, "").trim() || null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// We self-host the photos in /public rather than hotlinking upload.wikimedia.org
// at runtime — a page loading 200+ distinct images at once reliably triggers
// Wikimedia's rate limiting (429s), which we hit in practice while building this.
// Retries with backoff on 429, and the whole script is safe to re-run: it
// skips any file that's already on disk, so interrupted runs just resume.
async function downloadImage(url, destPath, attempt = 1) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429 && attempt <= 5) {
    const wait = attempt * 4000;
    await sleep(wait);
    return downloadImage(url, destPath, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return buf.length;
}

function slugify(brand, model) {
  return `${brand}-${model}`
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const raw = JSON.parse(
    await (await import("node:fs/promises")).readFile(
      path.join(__dirname, "car-list.json"),
      "utf8"
    )
  );
  const cars = raw.map((c) => ({ ...c, slug: slugify(c.brand, c.model) }));

  const results = [];
  for (const car of cars) {
    try {
      const r = await searchCarImage(car.slug, car.brand, car.model);
      results.push(r);
      console.log(r ? `✓ ${car.brand} ${car.model} -> ${r.pageTitle}` : `✗ ${car.brand} ${car.model} (no image)`);
    } catch (e) {
      console.log(`✗ ${car.brand} ${car.model} (error: ${e.message})`);
      results.push(null);
    }
    await sleep(120);
  }

  const fileTitles = [...new Set(results.filter((r) => r?.imageFile).map((r) => r.imageFile))];
  console.log(`Fetching attribution for ${fileTitles.length} files...`);
  const attribution = await fetchAttribution(fileTitles);

  await mkdir(PHOTOS_DIR, { recursive: true });

  const entries = [];
  for (const r of results) {
    if (!r) continue;
    const lookupKey = r.imageFile ? r.imageFile.replaceAll("_", " ") : null;
    const attr = lookupKey ? attribution[lookupKey] : null;

    const ext = (path.extname(new URL(r.thumbUrl).pathname) || ".jpg").toLowerCase();
    const fileName = `${r.slug}${ext}`;
    const destPath = path.join(PHOTOS_DIR, fileName);
    if (existsSync(destPath)) {
      console.log(`  = ${fileName} (already downloaded)`);
    } else {
      try {
        const bytes = await downloadImage(r.thumbUrl, destPath);
        console.log(`  ↓ ${fileName} (${Math.round(bytes / 1024)} KB)`);
      } catch (e) {
        console.log(`  ✗ download failed for ${r.slug}: ${e.message}`);
        continue;
      }
      await sleep(300);
    }

    entries.push([
      r.slug,
      {
        src: `/car-photos/${fileName}`,
        width: r.thumbWidth,
        height: r.thumbHeight,
        sourcePageUrl: r.pageUrl,
        sourcePageTitle: r.pageTitle,
        artist: attr?.artist ?? null,
        license: attr?.license ?? null,
        licenseUrl: attr?.licenseUrl ?? null,
      },
    ]);
  }

  const outPath = path.join(__dirname, "../src/data/carImages.generated.ts");
  const body = `// AUTO-GENERATED by scripts/fetch-car-images.mjs — do not edit by hand.
// Photos are sourced from Wikipedia/Wikimedia Commons and remain under
// their original licenses; see each entry's sourcePageUrl for attribution.
import type { CarImage } from "@/lib/types";

export const CAR_IMAGES: Record<string, CarImage> = ${JSON.stringify(
    Object.fromEntries(entries),
    null,
    2
  )};
`;
  await writeFile(outPath, body, "utf8");
  console.log(`\nWrote ${entries.length}/${cars.length} images to ${outPath}`);
}

main();
