import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyLemonSqueezySignature, type LemonSqueezyOrderWebhook } from "@/lib/lemonsqueezy";

// Lemon Squeezy posts JSON to this URL (configured in the Lemon Squeezy
// dashboard under Settings > Webhooks) — separate from the buyer-facing
// redirect set at checkout creation time.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const valid = verifyLemonSqueezySignature(rawBody, req.headers.get("x-signature"));
  if (!valid) {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 401 });
  }

  let payload: LemonSqueezyOrderWebhook;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  if (payload.meta.event_name !== "order_created") {
    return NextResponse.json({ ok: true, result: "ignored" });
  }

  const orderId = payload.meta.custom_data?.order_id;
  if (!orderId) {
    return NextResponse.json({ ok: false, reason: "missing_order_id" }, { status: 200 });
  }

  const db = supabaseAdmin();

  if (payload.data.attributes.status !== "paid") {
    await db
      .from("patron_orders")
      .update({
        status: "failed",
        note: `Lemon Squeezy status=${payload.data.attributes.status}`,
        provider_order_id: payload.data.id,
      })
      .eq("order_id", orderId)
      .eq("status", "pending");
    return NextResponse.json({ ok: true, result: "payment_not_paid" });
  }

  await db
    .from("patron_orders")
    .update({
      buyer_name: payload.data.attributes.user_name,
      buyer_email: payload.data.attributes.user_email,
      provider_order_id: payload.data.id,
    })
    .eq("order_id", orderId);

  const { data, error } = await db.rpc("settle_patron_order", {
    p_order_id: orderId,
    p_payment_id: payload.data.id,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true, result: data });
}
