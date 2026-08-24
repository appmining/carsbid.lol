import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Car photos are downloaded and self-hosted under /public/car-photos by
// scripts/fetch-car-images.mjs, so no remote image host needs allow-listing.
const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
