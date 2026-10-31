import "server-only";

/**
 * Tabby Payment Gateway Service (API v2)
 *
 * Implements server-side Tabby "Pay in 4" checkout, payment status retrieval,
 * capture, and refunds for Masaar Holidays (UAE & Saudi Arabia).
 *
 * Requirements:
 * - Server-only: Keys and secret credentials must never leak into client code.
 * - Pegged rates: USD to AED (3.6725), USD to SAR (3.75). No surcharges for Tabby.
 * - Safe lifecycle: Never trust return URL query params alone; always verify payment
 *   state server-side via GET /api/v2/payments/{id} and capture AUTHORIZED payments.
 */

export const TABBY_PEGGED_RATES = {
  AED: 3.6725,
  SAR: 3.75,
} as const;

export type TabbySupportedCurrency = "AED" | "SAR" | "KWD" | "BHD" | "QAR";

export interface TabbyConfig {
  secretKey: string;
  publicKey: string;
  merchantCode: string;
  merchantCodeSar?: string;
  webhookSecret: string;
  baseUrl: string;
  environment: "sandbox" | "production";
  isConfigured: boolean;
  isEnabled: boolean;
  isSarAvailable: boolean;
}

export interface TabbyBuyer {
  name: string;
  email: string;
  phone: string;
  dob?: string;
}

export interface TabbyOrderItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  referenceId?: string;
}

export interface TabbyCheckoutParams {
  amount: number;
  currency: TabbySupportedCurrency;
  description: string;
  referenceId: string;
  buyer: TabbyBuyer;
  items: TabbyOrderItem[];
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  shippingAddress?: {
    city?: string;
    address?: string;
    zip?: string;
  };
}

export interface TabbyCheckoutResult {
  sessionId: string;
  paymentId: string;
  webUrl: string;
  status: string;
  currency: TabbySupportedCurrency;
  amount: number;
  isMock?: boolean;
  rejectionReason?: string;
}

export interface TabbyPaymentResponse {
  id: string;
  status: "AUTHORIZED" | "CLOSED" | "REJECTED" | "EXPIRED" | "CREATED" | string;
  amount: string;
  currency: string;
  created_at?: string;
  description?: string;
  order?: {
    reference_id?: string;
  };
  captures?: Array<{
    id: string;
    amount: string;
    created_at: string;
  }>;
  refunds?: Array<{
    id: string;
    amount: string;
    reason?: string;
    created_at: string;
  }>;
  [key: string]: unknown;
}

export interface TabbyCaptureResult {
  id: string;
  amount: number;
  status: string;
  raw?: unknown;
}

export interface TabbyRefundResult {
  id: string;
  amount: number;
  status: string;
  raw?: unknown;
}

/**
 * Check if Tabby is enabled for customer checkouts.
 * Server-side feature flag and safety check:
 * 1. If TABBY_ENABLED is explicitly set to "false", Tabby is disabled.
 * 2. In production, Tabby is strictly DISABLED unless TABBY_ENABLED is explicitly "true"
 *    AND a valid live secret key starting with "sk_live_" is configured.
 * 3. In sandbox, Tabby is enabled if valid test credentials exist and TABBY_ENABLED is not "false".
 */
export function isTabbyCheckoutEnabled(): boolean {
  const secretKey = process.env.TABBY_SECRET_KEY?.trim() || "";
  const publicKey = process.env.TABBY_PUBLIC_KEY?.trim() || "";
  const envVar = process.env.TABBY_ENVIRONMENT?.trim().toLowerCase();
  const explicitFlag = process.env.TABBY_ENABLED?.trim().toLowerCase();

  // Explicit kill switch
  if (explicitFlag === "false" || explicitFlag === "0" || explicitFlag === "off") {
    return false;
  }

  const isConfigured = Boolean(
    secretKey &&
    secretKey.length > 8 &&
    !secretKey.includes("placeholder") &&
    !publicKey.includes("placeholder")
  );

  if (!isConfigured) return false;

  const isKeyLive = secretKey.startsWith("sk_live_");
  const isKeyTest = secretKey.startsWith("sk_test_");
  const isProduction = envVar === "production" || (isKeyLive && envVar !== "sandbox" && envVar !== "test");

  if (isProduction) {
    // In production: must have explicit TABBY_ENABLED="true" AND genuine live secret key
    if (explicitFlag !== "true") {
      return false;
    }
    if (!isKeyLive) {
      return false;
    }
    return true;
  }

  // In sandbox/development:
  return isKeyTest && explicitFlag !== "false";
}

/**
 * Retrieve Tabby server configuration from environment variables.
 */
export function getTabbyConfig(): TabbyConfig {
  const secretKey = process.env.TABBY_SECRET_KEY?.trim() || "";
  const publicKey = process.env.TABBY_PUBLIC_KEY?.trim() || "";
  const merchantCode = process.env.TABBY_MERCHANT_CODE?.trim() || "mhae";
  const merchantCodeSar = process.env.TABBY_MERCHANT_CODE_SAR?.trim() || "";
  const webhookSecret = process.env.TABBY_WEBHOOK_SECRET?.trim() || "";
  
  // Auto-detect sandbox vs production from key or explicit env
  const envVar = process.env.TABBY_ENVIRONMENT?.trim().toLowerCase();
  const isExplicitSandbox = envVar === "sandbox" || envVar === "test";
  const isKeySandbox = secretKey.startsWith("sk_test_") || publicKey.startsWith("pk_test_");
  const environment: "sandbox" | "production" = (isExplicitSandbox || isKeySandbox || !secretKey) ? "sandbox" : "production";

  // Tabby base URL
  const baseUrl = process.env.TABBY_BASE_URL?.trim() || "https://api.tabby.ai";

  const isConfigured = Boolean(
    secretKey &&
    secretKey.length > 8 &&
    !secretKey.includes("placeholder") &&
    !publicKey.includes("placeholder")
  );

  const isSarAvailable = Boolean(
    merchantCodeSar &&
    !merchantCodeSar.includes("placeholder") &&
    merchantCodeSar.length > 2
  );

  return {
    secretKey,
    publicKey,
    merchantCode,
    merchantCodeSar: isSarAvailable ? merchantCodeSar : undefined,
    webhookSecret,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    environment,
    isConfigured,
    isEnabled: isTabbyCheckoutEnabled(),
    isSarAvailable,
  };
}

/**
 * Currency conversion from USD to Tabby supported currency using official fixed pegged rates.
 */
export function convertUsdToTabbyCurrency(usdAmount: number, targetCurrency: "AED" | "SAR"): {
  amount: number;
  currency: "AED" | "SAR";
  rate: number;
  installmentAmount: number;
} {
  const rate = TABBY_PEGGED_RATES[targetCurrency] || 3.6725;
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
 * Format phone numbers to E.164 international format required by Tabby.
 */
function normalizeTabbyPhone(phone: string, defaultCountry = "971"): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0")) return `+${defaultCountry}${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

/**
 * Create a Tabby Checkout Session (POST /api/v2/checkout)
 */
export async function createTabbyCheckoutSession(
  params: TabbyCheckoutParams
): Promise<TabbyCheckoutResult> {
  const config = getTabbyConfig();

  // Strict configuration verification: never silently mock transactions if credentials are missing
  if (!config.isConfigured) {
    throw new Error(
      "Tabby payment gateway is not configured. Please supply valid Tabby API credentials in environment."
    );
  }

  // Feature flag & production safety check
  if (!config.isEnabled) {
    throw new Error(
      "Tabby payment gateway is currently disabled for customer checkouts."
    );
  }

  // SAR currency check: require active KSA merchant code or SAR activation
  if (params.currency === "SAR" && !config.isSarAvailable) {
    throw new Error(
      "Tabby Pay in 4 is currently unavailable for SAR transactions pending merchant activation. Please select Credit / Debit Card."
    );
  }

  // Safety checks: Prevent mixing live and test credentials
  if (config.environment === "sandbox" && config.secretKey.startsWith("sk_live_")) {
    throw new Error(
      "Safety violation: Live Tabby secret key detected while running in sandbox environment. Live charges are blocked."
    );
  }

  if (config.environment === "production" && config.secretKey.startsWith("sk_test_")) {
    throw new Error(
      "Safety violation: Test Tabby secret key detected while production environment is active."
    );
  }

  const normalizedPhone = normalizeTabbyPhone(params.buyer.phone, params.currency === "SAR" ? "966" : "971");

  // Determine regional merchant code (e.g. TABBY_MERCHANT_CODE_SAR for Saudi Arabia if configured)
  const effectiveMerchantCode =
    (params.currency === "SAR" && process.env.TABBY_MERCHANT_CODE_SAR?.trim()) ||
    config.merchantCode;

  const payload = {
    payment: {
      amount: params.amount.toFixed(2),
      currency: params.currency,
      description: params.description,
      buyer: {
        phone: normalizedPhone,
        email: params.buyer.email,
        name: params.buyer.name,
        dob: params.buyer.dob || undefined,
      },
      buyer_history: {
        registered_since: new Date().toISOString(),
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: params.referenceId,
        items: params.items.map((item) => ({
          title: item.title,
          description: item.description || item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice.toFixed(2),
          category: item.category || "Visa Services",
          reference_id: item.referenceId || params.referenceId,
        })),
      },
      order_history: [],
      shipping_address: {
        city: params.shippingAddress?.city || (params.currency === "SAR" ? "Riyadh" : "Dubai"),
        address: params.shippingAddress?.address || "Customer Residence",
        zip: params.shippingAddress?.zip || "00000",
      },
    },
    lang: "en",
    merchant_code: effectiveMerchantCode,
    merchant_urls: {
      success: params.successUrl,
      cancel: params.cancelUrl,
      failure: params.failureUrl,
    },
  };

  const endpoint = `${config.baseUrl}/api/v2/checkout`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.secretKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : "Network error contacting Tabby";
    console.error("[Tabby] Network request failed:", msg);
    throw new Error(`Tabby checkout connection failed: ${msg}`);
  }

  const rawJson = await response.json();

  if (!response.ok) {
    let errorMsg =
      rawJson.error ||
      rawJson.message ||
      rawJson.rejection_reason ||
      `Tabby checkout failed with HTTP ${response.status}`;
    if (typeof errorMsg === "string" && errorMsg.includes("only 'AED' is supported")) {
      errorMsg = `Tabby merchant account '${effectiveMerchantCode}' is restricted to AED. To charge Saudi Visas in SAR, a Tabby KSA merchant account is required, or the payment must be charged in AED.`;
    }
    console.error("[Tabby] Checkout creation error response:", rawJson);
    throw new Error(errorMsg);
  }

  // Extract installments webUrl from available products
  const availableInstallments = rawJson.configuration?.available_products?.installments;
  const firstProduct = Array.isArray(availableInstallments) ? availableInstallments[0] : null;
  const webUrl = firstProduct?.web_url;

  if (!webUrl) {
    // Check if Tabby provided a rejection reason (e.g. order amount out of bounds or unsupported country)
    const rejectionReason =
      rawJson.configuration?.products?.installments?.rejection_reason ||
      rawJson.rejection_reason ||
      "Installment plan is currently unavailable for this order.";
    console.warn("[Tabby] No web_url returned. Rejection reason:", rejectionReason);
    throw new Error(`Tabby Pay in 4 is not available: ${rejectionReason}`);
  }

  return {
    sessionId: rawJson.id,
    paymentId: rawJson.payment?.id || rawJson.id,
    webUrl,
    status: rawJson.status || "created",
    currency: params.currency,
    amount: params.amount,
  };
}

/**
 * Retrieve Tabby Payment State (GET /api/v2/payments/{id})
 */
export async function getTabbyPayment(paymentId: string): Promise<TabbyPaymentResponse> {
  const config = getTabbyConfig();

  if (!config.isConfigured) {
    throw new Error("Tabby is not configured. Missing secret key in environment.");
  }

  const endpoint = `${config.baseUrl}/api/v2/payments/${encodeURIComponent(paymentId)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const rawJson = await response.json();

  if (!response.ok) {
    const errorMsg = rawJson.error || rawJson.message || `Failed to fetch Tabby payment (HTTP ${response.status})`;
    console.error(`[Tabby] Error fetching payment ${paymentId}:`, rawJson);
    throw new Error(errorMsg);
  }

  return rawJson as TabbyPaymentResponse;
}

/**
 * Capture an Authorized Tabby Payment (POST /api/v2/payments/{id}/captures)
 * Moves payment from AUTHORIZED to CLOSED.
 */
export async function captureTabbyPayment(
  paymentId: string,
  amount: number,
  referenceId?: string
): Promise<TabbyCaptureResult> {
  const config = getTabbyConfig();

  if (!config.isConfigured) {
    throw new Error("Tabby is not configured. Missing secret key in environment.");
  }

  const endpoint = `${config.baseUrl}/api/v2/payments/${encodeURIComponent(paymentId)}/captures`;

  const payload = {
    amount: amount.toFixed(2),
    tax_amount: "0.00",
    shipping_amount: "0.00",
    discount_amount: "0.00",
    reference_id: referenceId,
    created_at: new Date().toISOString(),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secretKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawJson = await response.json();

  if (!response.ok) {
    const errorMsg = rawJson.error || rawJson.message || `Failed to capture Tabby payment (HTTP ${response.status})`;
    console.error(`[Tabby] Error capturing payment ${paymentId}:`, rawJson);
    throw new Error(errorMsg);
  }

  return {
    id: rawJson.id,
    amount: parseFloat(rawJson.amount || String(amount)),
    status: "CLOSED",
    raw: rawJson,
  };
}

/**
 * Refund a Captured Tabby Payment (POST /api/v2/payments/{id}/refunds)
 */
export async function refundTabbyPayment(
  paymentId: string,
  amount: number,
  reason?: string,
  referenceId?: string
): Promise<TabbyRefundResult> {
  const config = getTabbyConfig();

  if (!config.isConfigured) {
    throw new Error("Tabby is not configured. Missing secret key in environment.");
  }

  const endpoint = `${config.baseUrl}/api/v2/payments/${encodeURIComponent(paymentId)}/refunds`;

  const payload = {
    amount: amount.toFixed(2),
    reason: reason || "Customer request / cancellation",
    reference_id: referenceId,
    created_at: new Date().toISOString(),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secretKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawJson = await response.json();

  if (!response.ok) {
    const errorMsg = rawJson.error || rawJson.message || `Failed to refund Tabby payment (HTTP ${response.status})`;
    console.error(`[Tabby] Error refunding payment ${paymentId}:`, rawJson);
    throw new Error(errorMsg);
  }

  return {
    id: rawJson.id,
    amount: parseFloat(rawJson.amount || String(amount)),
    status: rawJson.status || "CLOSED",
    raw: rawJson,
  };
}
