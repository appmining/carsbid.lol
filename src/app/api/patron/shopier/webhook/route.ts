import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyShopierWebhook, type ShopierOrder } from "@/lib/shopier";

// Shopier posts JSON here once a webhook subscription is registered
// (POST /v1/webhooks — see lib/shopier.ts). Per docs, order.created only
// fires for orders that already have a completed payment. The body IS the
// Order object (no {event, data} envelope) — event type is a header.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const valid = verifyShopierWebhook(rawBody, req.headers.get("shopier-signature"));
  if (!valid) {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 401 });
  }

  if (req.headers.get("shopier-event") !== "order.created") {
    return NextResponse.json({ ok: true, result: "ignored" });
  }

  let order: ShopierOrder;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  if (order.paymentStatus !== "paid") {
    return NextResponse.json({ ok: true, result: "ignored" });
  }

  const productId = order.lineItems?.[0]?.productId;
  if (!productId) {
    return NextResponse.json({ ok: false, reason: "missing_product_id" }, { status: 200 });
  }

  const db = supabaseAdmin();

  const { data: patronOrder } = await db
    .from("patron_orders")
    .select("order_id")
    .eq("provider_order_id", productId)
    .maybeSingle();

  if (!patronOrder) {
    return NextResponse.json({ ok: false, reason: "order_not_found" }, { status: 200 });
  }

  const { data, error } = await db.rpc("settle_patron_order", {
    p_order_id: patronOrder.order_id,
    p_payment_id: order.id,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true, result: data });
}
