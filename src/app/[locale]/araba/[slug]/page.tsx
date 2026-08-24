import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CARS, getCar } from "@/data/cars";
import { CarDetailClient } from "@/components/CarDetailClient";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    CARS.map((c) => ({ locale, slug: c.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) return {};
  return {
    title: `${car.brand} ${car.model} — carsbid.lol`,
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const car = getCar(slug);
  if (!car) notFound();
  return <CarDetailClient car={car} />;
}
