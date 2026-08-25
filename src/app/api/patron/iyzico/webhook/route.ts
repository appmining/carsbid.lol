import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyIyzicoSignature, type IyzicoWebhookPayload } from "@/lib/iyzico";

// iyzico posts JSON here (configured in the merchant panel under Settings >
// Company Settings > Merchant Notifications). Signature verification only
// works once the signature feature is enabled on the account — email
// integration@iyzico.com to turn it on. Until then this endpoint rejects
// every request rather than trusting an unsigned payload.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let payload: IyzicoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const valid = verifyIyzicoSignature(payload, req.headers.get("x-iyz-signature-v3"));
  if (!valid) {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 401 });
  }

  const orderId = payload.paymentConversationId;
  if (!orderId) {
    return NextResponse.json({ ok: false, reason: "missing_order_id" }, { status: 200 });
  }

  const db = supabaseAdmin();

  if (payload.status !== "SUCCESS") {
    await db
      .from("patron_orders")
      .update({
        status: "failed",
        note: `iyzico status=${payload.status}`,
        provider_order_id: payload.paymentId,
      })
      .eq("order_id", orderId)
      .eq("status", "pending");
    return NextResponse.json({ ok: true, result: "payment_not_paid" });
  }

  await db
    .from("patron_orders")
    .update({ provider_order_id: payload.paymentId })
    .eq("order_id", orderId);

  const { data, error } = await db.rpc("settle_patron_order", {
    p_order_id: orderId,
    p_payment_id: payload.paymentId,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true, result: data });
}
