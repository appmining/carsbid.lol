import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { CARS } from "@/data/cars.generated";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createPatronCheckout } from "@/lib/iyzico";
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

  let checkoutUrl: string;
  try {
    checkoutUrl = await createPatronCheckout({
      orderId,
      productName: `${car.brand} ${car.model} — Patronluk`,
      description: body.tagline?.trim() || `${car.brand} ${car.model} sayfasının patronu ol.`,
      priceUsd: body.price,
    });
  } catch (err) {
    await db.from("patron_orders").update({ status: "failed", note: String(err) }).eq("order_id", orderId);
    return NextResponse.json({ error: "Ödeme başlatılamadı." }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl });
}
