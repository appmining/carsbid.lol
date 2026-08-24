import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { HOME_COUNTRY_CODE, countryName } from "@/lib/country";
import { CarsProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";

// One superfamily at two widths carries both roles: display runs expanded and
// heavy, body stays at normal width. The contrast comes from width and weight
// rather than a second typeface. `latin-ext` is required for Turkish (ı ğ ş İ).
// The CSS variable names are `--cb-font-*`, not `--font-*`: Tailwind v4's theme
// keys for the font utilities are also `--font-*`, so sharing the name makes
// the mapping in globals.css refer to itself.
const displayFont = Archivo({
  variable: "--cb-font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--cb-font-jetbrains",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  // The home market, not the visitor's country: reading request headers here
  // would make every route below this layout dynamic, including the ~11.5k
  // pre-rendered car pages. The home route overrides this with the real one.
  const country = countryName(HOME_COUNTRY_CODE, locale);
  return {
    title: t("title", { country }),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const skip = tNav("skipToContent");

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <CustomCursor />
        <NextIntlClientProvider>
          <CarsProvider>
            {/* First tabbable element on the page: lets a keyboard user jump
                past the nav instead of tabbing through it on every route. */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
            >
              {skip}
            </a>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </CarsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
