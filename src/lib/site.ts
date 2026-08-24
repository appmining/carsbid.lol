/** Absolute origin for sitemap/robots URLs. Vercel exposes the production
 *  domain as VERCEL_PROJECT_PRODUCTION_URL; the literal is the fallback for
 *  local builds. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "https://carsbid.lol";
}
