import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { usdToTry } from "@/lib/fx";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const API_BASE = "https://api.shopier.com/v1";

export interface CreateShopierCheckoutInput {
  productName: string;
  priceUsd: number;
  imageUrl: string;
}

/** Shopier's newer REST API (Personal Access Token, Bearer auth) — a fresh
 *  "digital product" is created per checkout with the bid price; its own
 *  storefront page (response.url) IS the checkout link, same shape as
 *  iyzico's iyzilink. Buyer info is collected on that page, not by us.
 *  https://developer.shopier.com/reference/post-products */
export async function createPatronCheckout(
  input: CreateShopierCheckoutInput
): Promise<{ checkoutUrl: string; productId: string }> {
  const token = requireEnv("SHOPIER_PERSONAL_ACCESS_TOKEN");
  // Shop currency is TRY-only — patron prices are USD everywhere else on
  // the site, so convert at checkout time with a live rate.
  const priceTry = await usdToTry(input.priceUsd);

  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.productName,
      type: "digital",
      media: [{ type: "image", url: input.imageUrl, placement: 1 }],
      priceData: { currency: "TRY", price: priceTry.toFixed(2) },
      shippingPayer: "sellerPays",
      stockQuantity: 1,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.url || !json.id) {
    throw new Error(json.message ?? json.error ?? "Shopier ürünü oluşturulamadı.");
  }

  return { checkoutUrl: json.url as string, productId: String(json.id) };
}

/** Signature scheme per docs: HMAC-SHA256 keyed by the per-webhook `token`
 *  (captured once at webhook-subscription creation time), compared against
 *  the Shopier-Signature header. The exact signed string (raw body only vs.
 *  id/timestamp mixed in) and encoding (hex vs base64) aren't spelled out
 *  in the docs beyond "HS256 using the webhook token" — this assumes raw
 *  body + hex, needs confirming against a real delivery. */
export function verifyShopierWebhook(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = requireEnv("SHOPIER_WEBHOOK_TOKEN");
  const digest = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  return digest.length === signature.length && timingSafeEqual(digest, signature);
}

export interface ShopierOrderCreatedPayload {
  event: string;
  data: {
    id: string;
    paymentStatus: "paid" | "unpaid";
    lineItems: Array<{ productId: string }>;
  };
}
