import "server-only";
import crypto from "crypto";

/**
 * Tamara Payment Gateway Service (Direct API v1 / v2)
 *
 * Implements server-side Tamara "Pay in 4 / Buy Now Pay Later" checkout,
 * order verification, authorization, capture, cancellation, and refund
 * processing for Masaar Holidays (UAE & Saudi Arabia).
 *
 * Requirements:
 * - Server-only: API tokens and notification tokens must NEVER leak to the browser.
 * - Exact Environment Variables:
 *     TAMARA_ENV=sandbox (or production)
 *     TAMARA_API_TOKEN=...
 *     TAMARA_NOTIFICATION_TOKEN=...
 *     TAMARA_PUBLIC_KEY=...
 * - Official endpoints:
 *     Sandbox: https://api-sandbox.tamara.co
 *     Production: https://api.tamara.co
 * - Pegged rates: USD to AED (3.6725), USD to SAR (3.75). No hidden surcharges.
 * - Lifecycle: Never trust return URL query params alone; verify authoritative status.
 */

export const TAMARA_PEGGED_RATES = {
  AED: 3.6725,
  SAR: 3.75,
} as const;

export type TamaraSupportedCurrency = "AED" | "SAR";

export interface TamaraConfig {
  apiToken: string;
  notificationToken: string;
  publicKey: string;
  baseUrl: string;
  environment: "sandbox" | "production";
  isConfigured: boolean;
  isEnabled: boolean;
}

export interface TamaraConsumer {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
}

export interface TamaraAddress {
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country_code: string; // e.g. "AE", "SA"
  phone_number: string;
}

export interface TamaraItem {
  reference_id: string;
  type: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: {
    amount: number;
    currency: TamaraSupportedCurrency;
  };
  total_amount: {
    amount: number;
    currency: TamaraSupportedCurrency;
  };
  discount_amount?: {
    amount: number;
    currency: TamaraSupportedCurrency;
  };
}

export interface TamaraCheckoutParams {
  orderReferenceId: string;
  amount: number;
  currency: TamaraSupportedCurrency;
  description: string;
  countryCode: "AE" | "SA";
  consumer: TamaraConsumer;
  items: TamaraItem[];
  successUrl: string;
  failureUrl: string;
  cancelUrl: string;
  notificationUrl: string;
  shippingAddress?: TamaraAddress;
  billingAddress?: TamaraAddress;
  paymentType?: "PAY_BY_INSTALMENTS" | "PAY_BY_LATER";
  instalments?: number;
}

export interface TamaraCheckoutResult {
  order_id: string;
  checkout_id: string;
  checkout_url: string;
  status: string;
  currency: TamaraSupportedCurrency;
  amount: number;
  isMock?: boolean;
}

export interface TamaraOrderResponse {
  order_id: string;
  order_reference_id: string;
  status:
    | "new"
    | "approved"
    | "authorised"
    | "captured"
    | "declined"
    | "expired"
    | "canceled"
    | "refunded"
    | "partially_refunded"
    | string;
  total_amount: {
    amount: number;
    currency: string;
  };
  authorised_amount?: {
    amount: number;
    currency: string;
  };
  captured_amount?: {
    amount: number;
    currency: string;
  };
  refunded_amount?: {
    amount: number;
    currency: string;
  };
  consumer?: TamaraConsumer;
  items?: TamaraItem[];
  created_at?: string;
  [key: string]: unknown;
}

export interface TamaraAuthoriseResult {
  order_id: string;
  status: string;
  authorised_amount?: {
    amount: number;
    currency: string;
  };
  auto_captured?: boolean;
  capture_id?: string;
  [key: string]: unknown;
}

export interface TamaraCaptureResult {
  capture_id: string;
  order_id: string;
  status: string;
  captured_amount?: {
    amount: number;
    currency: string;
  };
  [key: string]: unknown;
}

export interface TamaraRefundResult {
  refund_id: string;
  order_id: string;
  status: string;
  refunded_amount?: {
    amount: number;
    currency: string;
  };
  [key: string]: unknown;
}

export interface TamaraCancelResult {
  cancel_id: string;
  order_id: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Retrieve Tamara server configuration from environment variables.
 */
export function getTamaraConfig(): TamaraConfig {
  const apiToken = process.env.TAMARA_API_TOKEN?.trim() || "";
  const notificationToken = process.env.TAMARA_NOTIFICATION_TOKEN?.trim() || "";
  const publicKey = process.env.TAMARA_PUBLIC_KEY?.trim() || "";

  const envVar = (process.env.TAMARA_ENV || process.env.NODE_ENV || "sandbox").trim().toLowerCase();
  const environment: "sandbox" | "production" =
    envVar === "production" || envVar === "prod" || envVar === "live" ? "production" : "sandbox";

  const baseUrl =
    environment === "production"
      ? "https://api.tamara.co"
      : "https://api-sandbox.tamara.co";

  const isConfigured = Boolean(
    apiToken &&
    apiToken.length > 8 &&
    !apiToken.includes("placeholder") &&
    !apiToken.includes("your-tamara")
  );

  const isEnabled = isTamaraCheckoutEnabled();

  return {
    apiToken,
    notificationToken,
    publicKey,
    baseUrl,
    environment,
    isConfigured,
    isEnabled,
  };
}

/**
 * Check if Tamara is enabled for customer checkouts.
 */
export function isTamaraCheckoutEnabled(): boolean {
  const explicitFlag = process.env.TAMARA_ENABLED?.trim().toLowerCase();
  if (explicitFlag === "false" || explicitFlag === "0" || explicitFlag === "off") {
    return false;
  }

  const apiToken = process.env.TAMARA_API_TOKEN?.trim() || "";
  const envVar = (process.env.TAMARA_ENV || "sandbox").trim().toLowerCase();
  const isProduction = envVar === "production" || envVar === "prod" || envVar === "live";

  const isConfigured = Boolean(
    apiToken &&
    apiToken.length > 8 &&
    !apiToken.includes("placeholder") &&
    !apiToken.includes("your-tamara")
  );

  if (!isConfigured) return false;

  if (isProduction) {
    return explicitFlag === "true";
  }

  return explicitFlag !== "false";
}

/**
 * Format phone number to E.164 international standard (+971...)
 */
export function normalizeTamaraPhone(phone: string, defaultCountry = "971"): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0")) return `+${defaultCountry}${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

/**
 * Currency conversion from USD to Tamara supported currency using official fixed pegged rates.
 */
export function convertUsdToTamaraCurrency(
  usdAmount: number,
  targetCurrency: TamaraSupportedCurrency = "AED"
): {
  amount: number;
  currency: TamaraSupportedCurrency;
  rate: number;
  installmentAmount: number;
} {
  const rate = TAMARA_PEGGED_RATES[targetCurrency] || 3.6725;
  const converted = Math.round(usdAmount * rate * 100) / 100;
  const installment = Math.round((converted / 4) * 100) / 100;

  return {
    amount: converted,
    currency: targetCurrency,
    rate,
    installmentAmount: installment,
  };
}

/**
 * Create a Tamara Checkout Session (POST /checkout)
 */
export async function createTamaraCheckoutSession(
  params: TamaraCheckoutParams
): Promise<TamaraCheckoutResult> {
  const config = getTamaraConfig();

  // Defensive fallback for dev/demo if token is unconfigured
  if (!config.isConfigured || !config.apiToken) {
    if (config.environment === "sandbox" && process.env.NODE_ENV !== "production") {
      console.warn("[tamara] Unconfigured sandbox environment: generating mock checkout session");
      const mockOrderId = `tamara-mock-${Date.now()}`;
      return {
        order_id: mockOrderId,
        checkout_id: `chk-${mockOrderId}`,
        checkout_url: `${params.successUrl}?payment_id=${mockOrderId}&orderId=${mockOrderId}&tamara=1&mock=true`,
        status: "new",
        currency: params.currency,
        amount: params.amount,
        isMock: true,
      };
    }
    throw new Error("Tamara payment gateway is not configured. Please contact support.");
  }

  const phone = normalizeTamaraPhone(params.consumer.phone_number, params.countryCode === "SA" ? "966" : "971");

  const fallbackAddress: TamaraAddress = {
    first_name: params.consumer.first_name || "Guest",
    last_name: params.consumer.last_name || "Pilgrim",
    line1: "Masaar Holidays Client Booking",
    city: params.countryCode === "SA" ? "Riyadh" : "Dubai",
    country_code: params.countryCode,
    phone_number: phone,
  };

  const payload = {
    order_reference_id: params.orderReferenceId,
    total_amount: {
      amount: Math.round(params.amount * 100) / 100,
      currency: params.currency,
    },
    description: params.description.slice(0, 250),
    country_code: params.countryCode,
    payment_type: params.paymentType || "PAY_BY_INSTALMENTS",
    instalments: params.instalments || 4,
    items: params.items.map((item) => ({
      reference_id: item.reference_id,
      type: item.type || "digital",
      name: item.name.slice(0, 120),
      sku: item.sku || item.reference_id,
      quantity: item.quantity,
      unit_price: {
        amount: Math.round(item.unit_price.amount * 100) / 100,
        currency: item.unit_price.currency,
      },
      total_amount: {
        amount: Math.round(item.total_amount.amount * 100) / 100,
        currency: item.total_amount.currency,
      },
    })),
    consumer: {
      first_name: params.consumer.first_name || "Valued",
      last_name: params.consumer.last_name || "Guest",
      phone_number: phone,
      email: params.consumer.email,
    },
    shipping_address: params.shippingAddress || fallbackAddress,
    billing_address: params.billingAddress || params.shippingAddress || fallbackAddress,
    merchant_url: {
      success: params.successUrl,
      failure: params.failureUrl,
      cancel: params.cancelUrl,
      notification: params.notificationUrl,
    },
  };

  const endpoint = `${config.baseUrl}/checkout`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response from Tamara API (HTTP ${response.status}): ${responseText.slice(0, 200)}`);
  }

  if (!response.ok) {
    const errorMsg =
      (typeof json.message === "string" && json.message) ||
      (Array.isArray(json.errors) && json.errors.map((e: any) => e.error || e.message).join(", ")) ||
      `Tamara checkout session creation failed with HTTP ${response.status}`;
    console.error("[tamara] Checkout creation error:", errorMsg);
    throw new Error(errorMsg);
  }

  return {
    order_id: String(json.order_id || ""),
    checkout_id: String(json.checkout_id || ""),
    checkout_url: String(json.checkout_url || ""),
    status: String(json.status || "new"),
    currency: params.currency,
    amount: params.amount,
  };
}

/**
 * Retrieve Order details from Tamara API (GET /orders/{order_id})
 */
export async function getTamaraOrder(orderId: string): Promise<TamaraOrderResponse> {
  const config = getTamaraConfig();

  if (!config.isConfigured || !config.apiToken) {
    if (orderId.includes("mock")) {
      return {
        order_id: orderId,
        order_reference_id: "MH-MOCK-REF",
        status: "authorised",
        total_amount: { amount: 100, currency: "AED" },
      };
    }
    throw new Error("Tamara API token is not configured.");
  }

  const endpoint = `${config.baseUrl}/orders/${encodeURIComponent(orderId)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const responseText = await response.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid response from Tamara API (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = (typeof json.message === "string" && json.message) || `Failed to fetch Tamara order (HTTP ${response.status})`;
    throw new Error(msg);
  }

  return json as unknown as TamaraOrderResponse;
}

/**
 * Authorise an approved Tamara order (POST /orders/{order_id}/authorise)
 */
export async function authoriseTamaraOrder(orderId: string): Promise<TamaraAuthoriseResult> {
  const config = getTamaraConfig();

  if (!config.isConfigured || !config.apiToken) {
    if (orderId.includes("mock")) {
      return { order_id: orderId, status: "authorised" };
    }
    throw new Error("Tamara API token is not configured.");
  }

  const endpoint = `${config.baseUrl}/orders/${encodeURIComponent(orderId)}/authorise`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  const responseText = await response.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid response from Tamara Authorise API (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = (typeof json.message === "string" && json.message) || `Failed to authorise Tamara order ${orderId}`;
    throw new Error(msg);
  }

  return json as unknown as TamaraAuthoriseResult;
}

/**
 * Capture an authorised Tamara order (POST /payments/capture)
 */
export async function captureTamaraPayment(
  orderId: string,
  amount: number,
  currency: string,
  shippingInfo?: {
    shipped_at?: string;
    shipping_company?: string;
    tracking_number?: string;
  }
): Promise<TamaraCaptureResult> {
  const config = getTamaraConfig();

  if (!config.isConfigured || !config.apiToken) {
    if (orderId.includes("mock")) {
      return { capture_id: `cap-${Date.now()}`, order_id: orderId, status: "captured" };
    }
    throw new Error("Tamara API token is not configured.");
  }

  const endpoint = `${config.baseUrl}/payments/capture`;
  const payload = {
    order_id: orderId,
    total_amount: {
      amount: Math.round(amount * 100) / 100,
      currency: currency.toUpperCase(),
    },
    shipping_info: {
      shipped_at: shippingInfo?.shipped_at || new Date().toISOString(),
      shipping_company: shippingInfo?.shipping_company || "Masaar Holidays Concierge",
      tracking_number: shippingInfo?.tracking_number || orderId,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid response from Tamara Capture API (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = (typeof json.message === "string" && json.message) || `Failed to capture Tamara payment ${orderId}`;
    throw new Error(msg);
  }

  return {
    capture_id: String(json.capture_id || `cap-${orderId}`),
    order_id: orderId,
    status: String(json.status || "captured"),
    captured_amount: json.captured_amount as { amount: number; currency: string } | undefined,
  };
}

/**
 * Process a full or partial refund via Tamara Simplified Refund API (POST /payments/simplified-refund)
 */
export async function refundTamaraPayment(
  orderId: string,
  amount: number,
  currency: string,
  comment = "Masaar Holidays refund"
): Promise<TamaraRefundResult> {
  const config = getTamaraConfig();

  if (!config.isConfigured || !config.apiToken) {
    if (orderId.includes("mock")) {
      return { refund_id: `ref-${Date.now()}`, order_id: orderId, status: "refunded" };
    }
    throw new Error("Tamara API token is not configured.");
  }

  const endpoint = `${config.baseUrl}/payments/simplified-refund`;
  const payload = {
    order_id: orderId,
    total_amount: {
      amount: Math.round(amount * 100) / 100,
      currency: currency.toUpperCase(),
    },
    comment: comment.slice(0, 250),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid response from Tamara Refund API (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = (typeof json.message === "string" && json.message) || `Failed to process Tamara refund for order ${orderId}`;
    throw new Error(msg);
  }

  return {
    refund_id: String(json.refund_id || `ref-${orderId}`),
    order_id: orderId,
    status: String(json.status || "refunded"),
    refunded_amount: json.refunded_amount as { amount: number; currency: string } | undefined,
  };
}

/**
 * Cancel an authorised / approved Tamara order (POST /orders/{order_id}/cancel)
 */
export async function cancelTamaraOrder(
  orderId: string,
  amount: number,
  currency: string,
  comment = "Order cancelled"
): Promise<TamaraCancelResult> {
  const config = getTamaraConfig();

  if (!config.isConfigured || !config.apiToken) {
    if (orderId.includes("mock")) {
      return { cancel_id: `cnl-${Date.now()}`, order_id: orderId, status: "canceled" };
    }
    throw new Error("Tamara API token is not configured.");
  }

  const endpoint = `${config.baseUrl}/orders/${encodeURIComponent(orderId)}/cancel`;
  const payload = {
    total_amount: {
      amount: Math.round(amount * 100) / 100,
      currency: currency.toUpperCase(),
    },
    comment: comment.slice(0, 250),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid response from Tamara Cancel API (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = (typeof json.message === "string" && json.message) || `Failed to cancel Tamara order ${orderId}`;
    throw new Error(msg);
  }

  return {
    cancel_id: String(json.cancel_id || `cnl-${orderId}`),
    order_id: orderId,
    status: String(json.status || "canceled"),
  };
}

/**
 * Verifies the Tamara webhook notification token / JWT using HS256 algorithm.
 *
 * Tamara webhook notifications include an Authorization header with Bearer JWT,
 * or tamara-signature header signed with the merchant's TAMARA_NOTIFICATION_TOKEN.
 */
export function verifyTamaraNotification(
  tokenOrHeader: string,
  notificationToken: string
): { valid: boolean; payload?: Record<string, unknown>; error?: string } {
  if (!notificationToken || !notificationToken.trim()) {
    // If notification token is not configured in environment, fail securely
    return { valid: false, error: "TAMARA_NOTIFICATION_TOKEN is not configured" };
  }

  const rawToken = tokenOrHeader.replace(/^Bearer\s+/i, "").trim();
  if (!rawToken) {
    return { valid: false, error: "Missing notification token in authorization header" };
  }

  // If token is direct equality match with notificationToken (simple token mode)
  if (rawToken === notificationToken) {
    return { valid: true };
  }

  // Parse JWT parts (header.payload.signature)
  const parts = rawToken.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Invalid JWT format for Tamara notification" };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    // Decode header
    const headerStr = Buffer.from(headerB64, "base64url").toString("utf8");
    const header = JSON.parse(headerStr);

    if (header.alg && header.alg !== "HS256") {
      return { valid: false, error: `Unsupported JWT algorithm: ${header.alg}` };
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", notificationToken)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSignature))) {
      return { valid: false, error: "Invalid JWT signature" };
    }

    // Decode and return payload
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);

    return { valid: true, payload };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "JWT parsing failed";
    return { valid: false, error: msg };
  }
}
