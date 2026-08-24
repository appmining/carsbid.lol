// `Segment` only describes the hand-maintained input list in src/data/cars.ts.
// It is deliberately NOT the shape the app filters on: it mixes body style with
// powertrain, which is why a Tesla Model Y tagged "suv" never showed up under
// the electric filter. The generated catalogue splits the two axes below.
export type Segment =
  | "sedan"
  | "hatchback"
  | "suv"
  | "pickup"
  | "mpv"
  | "spor"
  | "elektrikli"
  | "offroad";

/** What the car *is* — one value per model, drives the body-type tabs. */
export type BodyType =
  | "sedan"
  | "hatchback"
  | "suv"
  | "mpv"
  | "spor"
  | "pickup"
  | "offroad";

export const BODY_TYPES: BodyType[] = [
  "suv",
  "sedan",
  "hatchback",
  "spor",
  "mpv",
  "pickup",
  "offroad",
];

/** What drives it — a model can offer several, so this is a list.
 *  "ice" is the default: only electric and hybrid are scraped, so anything
 *  untagged is combustion rather than unknown. */
export type Powertrain = "ev" | "hybrid" | "ice";

export const POWERTRAINS: Powertrain[] = ["ev", "hybrid", "ice"];

export interface CarImage {
  /** 16:9 derivative — showcase tiles, detail hero. */
  wide: string;
  /** 1:1 derivative — avatars, list thumbnails, podium. */
  square: string;
  width: number;
  height: number;
  /** Tiny inline base64 for `placeholder="blur"`. */
  blurDataURL: string;
  sourcePageUrl: string;
  sourcePageTitle: string;
  artist: string | null;
  license: string | null;
  licenseUrl: string | null;
}

export interface CarModel {
  slug: string;
  brand: string;
  model: string;
  body: BodyType;
  powertrain: Powertrain[];
  /** [first year, last year] — null end means still in production. */
  years: [number, number | null] | null;
  generations: number;
  /** 0–1, from Wikipedia pageviews. Orders the catalogue tail so well-known
   *  models surface before obscure ones while the vote table is still empty. */
  prominence: number;
}

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube"
  | "website"
  | "diger";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "x",
  "youtube",
  "website",
  "diger",
];

export interface PatronHistoryEntry {
  name: string;
  platform: SocialPlatform;
  handle: string;
  price: number;
}

export interface Patron {
  modelSlug: string;
  name: string;
  tagline: string;
  platform: SocialPlatform;
  handle: string;
  url: string;
  price: number;
  history: PatronHistoryEntry[];
}
