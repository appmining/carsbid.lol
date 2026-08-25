import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { CARS } from "@/data/cars.generated";
import { supabaseAdmin } from "@/lib/supabase/server";
import { buildShopierCheckoutFields } from "@/lib/shopier";
import type { SocialPlatform } from "@/lib/types";
import { routing } from "@/i18n/routing";

const PLATFORMS: SocialPlatform[] = ["instagram", "tiktok", "x", "youtube", "website", "diger"];

interface CheckoutBody {
  slug: string;
  name: string;
  tagline: string;
  platform: SocialPlatform;
  handle: string;
  url: string;
  price: number;
  locale?: string;
  buyer: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    idNumber: string;
    address: string;
    city: string;
    postcode: string;
  };
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }

  const car = CARS.find((c) => c.slug === body.slug);
  if (!car) return badRequest("Araç modeli bulunamadı.");

  if (!body.name?.trim() || !body.handle?.trim() || !body.url?.trim()) {
    return badRequest("Görünen ad, hesap ve bağlantı zorunlu.");
  }
  if (!PLATFORMS.includes(body.platform)) return badRequest("Geçersiz platform.");
  if (!Number.isFinite(body.price) || body.price <= 0) return badRequest("Geçersiz teklif.");

  const buyer = body.buyer;
  if (
    !buyer?.name?.trim() ||
    !buyer.surname?.trim() ||
    !buyer.email?.trim() ||
    !buyer.phone?.trim() ||
    !buyer.idNumber?.trim() ||
    !buyer.address?.trim() ||
    !buyer.city?.trim() ||
    !buyer.postcode?.trim()
  ) {
    return badRequest("Shopier ödeme sayfası için tüm alıcı bilgileri zorunlu.");
  }

  const db = supabaseAdmin();
  const { data: current, error: currentError } = await db
    .from("patrons")
    .select("price")
    .eq("car_slug", body.slug)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }

  const minPrice = (current?.price ?? 0) + 1;
  if (body.price < minPrice) {
    return badRequest(`Teklif en az $${minPrice} olmalı — biri sizden önce teklif vermiş olabilir.`);
  }

  const orderId = randomUUID();

  const { error: insertError } = await db.from("patron_orders").insert({
    car_slug: body.slug,
    order_id: orderId,
    name: body.name.trim(),
    tagline: body.tagline?.trim() ?? "",
    platform: body.platform,
    handle: body.handle.trim(),
    url: body.url.trim(),
    price: body.price,
    buyer_name: `${buyer.name.trim()} ${buyer.surname.trim()}`,
    buyer_email: buyer.email.trim(),
    buyer_phone: buyer.phone.trim(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const origin = req.nextUrl.origin;
  const locale = routing.locales.includes(body.locale as (typeof routing.locales)[number])
    ? (body.locale as string)
    : routing.defaultLocale;

  const { actionUrl, fields } = buildShopierCheckoutFields({
    orderId,
    productName: `${car.brand} ${car.model} — Patronluk`,
    priceUsd: body.price,
    callbackUrl: `${origin}/api/patron/shopier/callback`,
    locale,
    buyer: {
      name: buyer.name.trim(),
      surname: buyer.surname.trim(),
      email: buyer.email.trim(),
      phone: buyer.phone.trim(),
      idNumber: buyer.idNumber.trim(),
      address: buyer.address.trim(),
      city: buyer.city.trim(),
      postcode: buyer.postcode.trim(),
    },
  });

  return NextResponse.json({ actionUrl, fields });
}
