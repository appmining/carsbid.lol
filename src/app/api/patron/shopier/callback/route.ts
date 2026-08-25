import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyShopierCallback, type ShopierCallbackPayload } from "@/lib/shopier";
import { routing } from "@/i18n/routing";

// Shopier's classic API redirects the BUYER'S BROWSER here with a POST
// (not a separate server-to-server webhook) once they finish paying on
// Shopier's hosted page — see lib/shopier.ts for why. We verify the
// signature, settle the order, then send the browser on to /patronlar.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const payload: ShopierCallbackPayload = {
    platform_order_id: String(form.get("platform_order_id") ?? ""),
    status: String(form.get("status") ?? ""),
    installment: String(form.get("installment") ?? ""),
    payment_id: String(form.get("payment_id") ?? ""),
    random_nr: String(form.get("random_nr") ?? ""),
    signature: String(form.get("signature") ?? ""),
  };

  const origin = req.nextUrl.origin;
  const fallbackUrl = `${origin}/${routing.defaultLocale}/patronlar?patron=error`;

  if (!payload.platform_order_id || !verifyShopierCallback(payload)) {
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  const orderId = payload.platform_order_id;
  const db = supabaseAdmin();

  const { data: order } = await db
    .from("patron_orders")
    .select("car_slug")
    .eq("order_id", orderId)
    .maybeSingle();

  const redirectSlug = order?.car_slug;
  const redirectBase = `${origin}/${routing.defaultLocale}/patronlar`;

  if (payload.status !== "success") {
    await db
      .from("patron_orders")
      .update({ status: "failed", note: `Shopier status=${payload.status}`, provider_order_id: payload.payment_id })
      .eq("order_id", orderId)
      .eq("status", "pending");
    return NextResponse.redirect(`${redirectBase}?patron=failed&slug=${redirectSlug ?? ""}`, { status: 303 });
  }

  await db
    .from("patron_orders")
    .update({ provider_order_id: payload.payment_id })
    .eq("order_id", orderId);

  const { data: result, error } = await db.rpc("settle_patron_order", {
    p_order_id: orderId,
    p_payment_id: payload.payment_id,
  });

  if (error) {
    return NextResponse.redirect(`${redirectBase}?patron=error&slug=${redirectSlug ?? ""}`, { status: 303 });
  }

  const status = result === "paid" ? "paid" : result === "outbid" ? "outbid" : "error";
  return NextResponse.redirect(`${redirectBase}?patron=${status}&slug=${redirectSlug ?? ""}`, { status: 303 });
}
