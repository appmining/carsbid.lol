import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

/** IYZWSv2 auth: HMACSHA256(randomKey + uriPath + body, secretKey), then
 *  "apiKey:...&randomKey:...&signature:..." base64-encoded as the header.
 *  https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth */
function buildAuthHeader(uriPath: string, body: string): { authorization: string; randomKey: string } {
  const apiKey = requireEnv("IYZICO_API_KEY");
  const secretKey = requireEnv("IYZICO_SECRET_KEY");
  const randomKey = `${Date.now()}${randomBytes(8).toString("hex")}`;

  const payload = `${randomKey}${uriPath}${body}`;
  const signature = createHmac("sha256", secretKey).update(payload).digest("hex");
  const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  const authorization = `IYZWSv2 ${Buffer.from(authorizationString, "utf8").toString("base64")}`;

  return { authorization, randomKey };
}

export interface CreatePatronCheckoutInput {
  orderId: string;
  productName: string;
  description: string;
  priceUsd: number;
}

export async function createPatronCheckout(input: CreatePatronCheckoutInput): Promise<string> {
  const baseUrl = requireEnv("IYZICO_BASE_URL");
  const uriPath = "/v2/iyzilink/products";

  const body = JSON.stringify({
    conversationId: input.orderId,
    name: input.productName,
    description: input.description,
    price: input.priceUsd.toFixed(2),
    currencyCode: "USD",
    // Buyer can pay once, then the link stops selling — mirrors a one-time checkout.
    stockEnabled: true,
    stockCount: 1,
  });

  const { authorization, randomKey } = buildAuthHeader(uriPath, body);

  const res = await fetch(`${baseUrl}${uriPath}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "x-iyzi-rnd": randomKey,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = await res.json();
  if (json.status !== "success" || !json.data?.url) {
    throw new Error(json.errorMessage ?? "iyzico ödeme linki oluşturulamadı.");
  }

  return json.data.url as string;
}

/** Direct/API-payment webhook format signature:
 *  HMACSHA256(secretKey + iyziEventType + paymentId + paymentConversationId + status, secretKey)
 *  hex-encoded. https://docs.iyzico.com/en/advanced/webhook
 *  Requires the signature feature to be enabled on the account first
 *  (email integration@iyzico.com) — until then there is no header to check
 *  and this correctly rejects every request. */
export function verifyIyzicoSignature(payload: IyzicoWebhookPayload, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secretKey = requireEnv("IYZICO_SECRET_KEY");
  const data = `${secretKey}${payload.iyziEventType}${payload.paymentId}${payload.paymentConversationId}${payload.status}`;
  const digest = Buffer.from(createHmac("sha256", secretKey).update(data).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");
  return digest.length === signature.length && timingSafeEqual(digest, signature);
}

export interface IyzicoWebhookPayload {
  paymentConversationId: string;
  merchantId?: string;
  paymentId: string;
  status: "SUCCESS" | "FAILURE" | string;
  iyziReferenceCode?: string;
  iyziEventType: string;
  iyziEventTime?: number;
  iyziPaymentId?: number;
}
