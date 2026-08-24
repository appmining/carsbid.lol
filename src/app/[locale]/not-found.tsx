import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Reached by notFound() from the car detail route. Without this the 404 fell
// through to Next's bare default page — no header, no footer, no theme.
export default async function NotFound() {
  const t = await getTranslations("notFoundPage");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 sm:px-6 py-24 text-center">
      <span className="font-mono-tab text-eyebrow font-semibold text-text-dim">404</span>
      <h1 className="font-display text-display font-bold mt-3">{t("title")}</h1>
      <p className="mt-4 text-text-muted">{t("body")}</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-2 active:scale-[0.97]"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
