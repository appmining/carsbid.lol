export type Segment =
  | "sedan"
  | "hatchback"
  | "suv"
  | "pickup"
  | "mpv"
  | "spor"
  | "elektrikli"
  | "offroad";

export const SEGMENTS: Segment[] = [
  "sedan",
  "hatchback",
  "suv",
  "pickup",
  "mpv",
  "spor",
  "elektrikli",
  "offroad",
];

export interface CarImage {
  src: string;
  width: number;
  height: number;
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
  segment: Segment;
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
