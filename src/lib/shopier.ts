import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const PAYMENT_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";

export interface CreateShopierCheckoutInput {
  orderId: string;
  productName: string;
  priceUsd: number;
  callbackUrl: string;
  locale: string;
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

/** Shopier's classic API is a client-submitted HTML form, not a JSON
 *  endpoint that hands back a URL — the buyer's browser POSTs these fields
 *  straight to Shopier's payment page. We build and sign the field map;
 *  the caller renders it as a hidden auto-submitting form.
 *  https://github.com/erkineren/shopier (reference implementation) */
export function buildShopierCheckoutFields(input: CreateShopierCheckoutInput): {
  actionUrl: string;
  fields: Record<string, string>;
} {
  const apiKey = requireEnv("SHOPIER_API_KEY");
  const apiSecret = requireEnv("SHOPIER_API_SECRET");
  const randomNr = String(Math.floor(100000 + Math.random() * 900000));
  const totalOrderValue = input.priceUsd.toFixed(2);
  const currency = "1"; // USD

  const dataToBeHashed = `${randomNr}${input.orderId}${totalOrderValue}${currency}`;
  const signature = createHmac("sha256", apiSecret).update(dataToBeHashed).digest("base64");

  const fields: Record<string, string> = {
    API_key: apiKey,
    website_index: "1",
    platform_order_id: input.orderId,
    product_name: input.productName,
    product_type: "1", // DOWNLOADABLE_VIRTUAL
    buyer_name: input.buyer.name,
    buyer_surname: input.buyer.surname,
    buyer_email: input.buyer.email,
    buyer_account_age: "0",
    buyer_id_nr: input.buyer.idNumber,
    buyer_phone: input.buyer.phone,
    billing_address: input.buyer.address,
    billing_city: input.buyer.city,
    billing_country: "Turkey",
    billing_postcode: input.buyer.postcode,
    shipping_address: input.buyer.address,
    shipping_city: input.buyer.city,
    shipping_country: "Turkey",
    shipping_postcode: input.buyer.postcode,
    total_order_value: totalOrderValue,
    currency,
    platform: "0",
    is_in_frame: "0",
    current_language: input.locale === "en" || input.locale === "es" ? "1" : "0",
    modul_version: "1.0.4",
    random_nr: randomNr,
    signature,
    callback: input.callbackUrl,
  };

  return { actionUrl: PAYMENT_URL, fields };
}

export interface ShopierCallbackPayload {
  platform_order_id: string;
  status: string;
  installment: string;
  payment_id: string;
  random_nr: string;
  signature: string;
}

/** Verifies the browser-redirected callback POST. Signature = base64(HMAC-SHA256(
 *  random_nr + platform_order_id, secret)) — both values come back in the
 *  callback itself, nothing needs to be pre-stored to check it. */
export function verifyShopierCallback(payload: ShopierCallbackPayload): boolean {
  const apiSecret = requireEnv("SHOPIER_API_SECRET");
  const expected = Buffer.from(
    createHmac("sha256", apiSecret).update(`${payload.random_nr}${payload.platform_order_id}`).digest("base64"),
    "utf8"
  );
  const received = Buffer.from(payload.signature ?? "", "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
