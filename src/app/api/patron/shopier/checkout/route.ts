import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { CARS } from "@/data/cars.generated";
import { CAR_IMAGES } from "@/data/carImages.generated";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createPatronCheckout } from "@/lib/shopier";
import type { SocialPlatform } from "@/lib/types";

const PLATFORMS: SocialPlatform[] = ["instagram", "tiktok", "x", "youtube", "website", "diger"];

interface CheckoutBody {
  slug: string;
  name: string;
  tagline: string;
  platform: SocialPlatform;
  handle: string;
  url: string;
  price: number;
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
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const origin = req.nextUrl.origin;
  const image = CAR_IMAGES[car.slug];

  let checkoutUrl: string;
  try {
    const result = await createPatronCheckout({
      productName: `${car.brand} ${car.model} — Patronluk`,
      priceUsd: body.price,
      imageUrl: image?.square ?? `${origin}/hero-pulse-poster.png`,
    });
    checkoutUrl = result.checkoutUrl;
    // The order.created webhook only carries the product id, not our own
    // order_id — store the mapping now so the webhook can look it back up.
    await db.from("patron_orders").update({ provider_order_id: result.productId }).eq("order_id", orderId);
  } catch (err) {
    await db.from("patron_orders").update({ status: "failed", note: String(err) }).eq("order_id", orderId);
    return NextResponse.json({ error: "Ödeme başlatılamadı." }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl });
}
