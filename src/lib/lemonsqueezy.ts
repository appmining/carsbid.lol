import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  lemonSqueezySetup({ apiKey: requireEnv("LEMONSQUEEZY_API_KEY") });
  configured = true;
}

export interface CreatePatronCheckoutInput {
  orderId: string;
  productName: string;
  description: string;
  priceUsd: number;
  redirectUrl: string;
}

export async function createPatronCheckout(input: CreatePatronCheckoutInput): Promise<string> {
  ensureConfigured();
  const storeId = requireEnv("LEMONSQUEEZY_STORE_ID");
  const variantId = requireEnv("LEMONSQUEEZY_VARIANT_ID");

  const { data, error } = await createCheckout(storeId, variantId, {
    customPrice: Math.round(input.priceUsd * 100),
    productOptions: {
      name: input.productName,
      description: input.description,
      redirectUrl: input.redirectUrl,
    },
    checkoutData: {
      custom: { order_id: input.orderId },
    },
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Lemon Squeezy checkout oluşturulamadı.");
  }

  return data.data.attributes.url;
}

export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = requireEnv("LEMONSQUEEZY_WEBHOOK_SECRET");
  const digest = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  return digest.length === signature.length && timingSafeEqual(digest, signature);
}

export interface LemonSqueezyOrderWebhook {
  meta: {
    event_name: string;
    custom_data?: { order_id?: string };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      user_name: string;
      user_email: string;
    };
  };
}
