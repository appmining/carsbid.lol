import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    // AVIF first: these are photographs, and it saves another 20-30% over WebP.
    formats: ["image/avif", "image/webp"],
    // Car photos live in Supabase Storage rather than the repo — 3858 models
    // times two derivatives is roughly half a gigabyte, which has no business
    // in git. Next's optimiser fetches each one once and caches it, so the
    // browser never talks to the storage host directly.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mmszczivilqeqvyrlnqg.supabase.co",
        pathname: "/storage/v1/object/public/car-photos/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
