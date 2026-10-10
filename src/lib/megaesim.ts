import "server-only";

/**
 * MegaEsim Reseller API Client (v1)
 *
 * Base URL: https://megaesim.com/api/v1/partner
 * All functions are strictly server-only and require MEGAESIM_API_KEY.
 * The API key is never logged or exposed to client bundles.
 */

export type PlanKind = "data" | "number";

export type CarrierOperator = {
  operatorName: string;
  networkType: string;
  [key: string]: unknown;
};

export type CarrierInfo = {
  locationName?: string;
  locationLogo?: string;
  locationCode?: string;
  operatorList?: CarrierOperator[];
  [key: string]: unknown;
};

export type Plan = {
  plan_id: string;
  name: string;
  plan_kind: PlanKind;
  data_gb: number;
  validity_days: number;
  is_unlimited: boolean;
  network_type: string;
  carriers: CarrierInfo[] | null;
  fup_note: string | null;
  supports_topup: boolean;
  supports_cancel: boolean;
  supports_hotspot: boolean | null;
  ip_export: string | null;
  retail_price: number;
  your_price: number;
  currency?: string;
  country?: string;
  calls?: string | number;
  sms?: string | number;
  number?: string;
  terms?: string[];
  [key: string]: unknown;
};

export type Esim = {
  item_id?: number;
  plan?: string;
  country?: string;
  data_gb?: number;
  validity_days?: number;
  price?: number;
  iccid: string;
  lpa: string;
  qr_url: string;
  status: string;
  expires_at: string | null;
  note?: string;
  [key: string]: unknown;
};

export type Order = {
  id: string | number;
  order_number: string;
  partner_ref: string;
  status: "processing" | "completed" | "provisioning_failed" | "refunded" | string;
  total: number;
  currency: string;
  end_user_email?: string;
  created_at: string;
  mode?: "sandbox" | "test" | "live" | string;
  wallet_balance?: number | null;
  replayed?: boolean;
  warning?: string;
  esims: Esim[];
  [key: string]: unknown;
};

export type MegaEsimAccount = {
  id: number;
  name: string;
  company: string;
  email: string;
  tier: string;
  discount_pct: number;
  account_mode: "sandbox" | "live" | string;
  price_floor: number | null;
  wallet_balance: number | null;
  currency: string;
  key_mode: "test" | "live" | string;
  [key: string]: unknown;
};

export type MegaEsimBalance = {
  mode: "test" | "live" | string;
  wallet_balance: number | null;
  currency: string;
  low_balance_threshold?: number;
  last_updated?: string;
  note?: string;
  [key: string]: unknown;
};

export type MegaEsimCountry = {
  id: number;
  name: string;
  slug: string;
  iso: string;
  flag_emoji: string;
  continent?: string | null;
  plan_count: number;
  [key: string]: unknown;
};

export type MegaEsimRegion = {
  id: number;
  name: string;
  slug: string;
  country_count: number;
  country_codes: string[];
  plan_count: number;
  [key: string]: unknown;
};

export type MegaEsimQrResponse = {
  mode?: string;
  iccid: string;
  lpa: string;
  qr_url: string;
  [key: string]: unknown;
};

export type MegaEsimUsageResponse = {
  mode?: string;
  iccid: string;
  status?: string;
  esim_status?: string;
  smdp_status?: string;
  provider_esim_status?: string;
  expires_at?: string | null;
  provider_usage?: Record<string, unknown>;
  [key: string]: unknown;
};

export type MegaEsimCancelResponse = {
  cancelled: boolean;
  iccid: string;
  refunded?: number;
  wallet_balance?: number;
  already?: boolean;
  mode?: string;
  note?: string;
  [key: string]: unknown;
};

export class MegaEsimError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly extra: Record<string, unknown>;

  constructor(params: {
    code: string;
    httpStatus: number;
    message: string;
    extra?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = "MegaEsimError";
    this.code = params.code;
    this.httpStatus = params.httpStatus;
    this.extra = params.extra ?? {};
    Object.setPrototypeOf(this, MegaEsimError.prototype);
  }
}

const DEFAULT_BASE_URL = "https://megaesim.com/api/v1/partner";
const PRICES_VERSION_URL = "https://megaesim.com/api/v1/prices/version/";
const USER_AGENT = "MasaarHolidays/1.0";
const REQUEST_TIMEOUT_MS = 10000;

function getBaseUrl(): string {
  const envUrl = process.env.MEGAESIM_BASE_URL?.trim();
  const url = envUrl || DEFAULT_BASE_URL;
  return url.replace(/\/+$/, "");
}

function getApiKey(): string {
  const key = process.env.MEGAESIM_API_KEY?.trim();
  if (!key) {
    throw new MegaEsimError({
      code: "unauthorized",
      httpStatus: 401,
      message: "Missing MEGAESIM_API_KEY environment variable",
    });
  }
  return key;
}

/**
 * Internal single request helper.
 * - sends Authorization: Bearer <key>, Content-Type: application/json, User-Agent: MasaarHolidays/1.0
 * - 10s timeout
 * - on 429 wait for Retry-After header (max 1 retry)
 * - parses MegaEsim's error envelope { error: { code, message, ...extra } } into a typed MegaEsimError
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const isAbsolute = path.startsWith("http://") || path.startsWith("https://");
  const fullUrl = isAbsolute
    ? path
    : `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const apiKey = getApiKey();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Handle rate-limiting: 429 with max 1 retry
    if (response.status === 429 && retryCount === 0) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
      const waitSeconds = Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec : 60;
      // Sleep for the Retry-After interval (capped between 1 and 60 seconds)
      const sleepMs = Math.min(Math.max(waitSeconds, 1), 60) * 1000;
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
      return request<T>(path, options, retryCount + 1);
    }

    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      bodyText = "";
    }

    let parsedJson: any = null;
    if (bodyText) {
      try {
        parsedJson = JSON.parse(bodyText);
      } catch {
        parsedJson = null;
      }
    }

    if (!response.ok) {
      if (parsedJson && typeof parsedJson === "object" && parsedJson.error) {
        const { code, message, ...extra } = parsedJson.error;
        throw new MegaEsimError({
          code: code || "error",
          httpStatus: response.status,
          message: message || "MegaEsim API request failed",
          extra,
        });
      }

      throw new MegaEsimError({
        code: `http_${response.status}`,
        httpStatus: response.status,
        message: bodyText || response.statusText || "HTTP error",
      });
    }

    return (parsedJson as T) ?? ({} as T);
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof MegaEsimError) {
      throw err;
    }

    if (err instanceof Error && err.name === "AbortError") {
      throw new MegaEsimError({
        code: "timeout",
        httpStatus: 408,
        message: `MegaEsim request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
      });
    }

    throw new MegaEsimError({
      code: "network_error",
      httpStatus: 500,
      message: err instanceof Error ? err.message : "Unknown network error",
    });
  }
}

/**
 * Returns account profile, tier, discount, mode, and wallet balance.
 */
export async function getAccount(): Promise<MegaEsimAccount> {
  return request<MegaEsimAccount>("/account");
}

/**
 * Returns wallet balance and threshold details.
 */
export async function getBalance(): Promise<MegaEsimBalance> {
  return request<MegaEsimBalance>("/balance");
}

/**
 * Returns countries with active plans in the catalogue.
 */
export async function getCountries(): Promise<MegaEsimCountry[]> {
  const data = await request<{ countries: MegaEsimCountry[] }>("/catalogue/countries");
  return data.countries ?? [];
}

/**
 * Returns regions in the catalogue.
 */
export async function getRegions(): Promise<MegaEsimRegion[]> {
  const data = await request<{ regions: MegaEsimRegion[] }>("/catalogue/regions");
  return data.regions ?? [];
}

/**
 * Returns plans for a specific country or region.
 */
export async function getPlans(params?: {
  country?: string;
  region?: string;
}): Promise<Plan[]> {
  const searchParams = new URLSearchParams();
  if (params?.country) {
    searchParams.set("country", params.country);
  } else if (params?.region) {
    searchParams.set("region", params.region);
  } else {
    throw new MegaEsimError({
      code: "invalid_request",
      httpStatus: 400,
      message: "getPlans requires either country or region parameter",
    });
  }

  const data = await request<{ plans: Plan[]; country?: string; region?: string }>(
    `/catalogue/plans?${searchParams.toString()}`
  );
  return data.plans ?? [];
}

/**
 * Returns one specific plan by plan_id.
 */
export async function getPlan(planId: string): Promise<Plan> {
  if (!planId) {
    throw new MegaEsimError({
      code: "invalid_plan",
      httpStatus: 400,
      message: "planId is required",
    });
  }
  return request<Plan>(`/catalogue/plan?plan_id=${encodeURIComponent(planId)}`);
}

/**
 * Checks prices version.
 * Note: this endpoint is at https://megaesim.com/api/v1/prices/version/,
 * OUTSIDE the partner base URL, requires no auth.
 */
export async function getPricesVersion(): Promise<{ version: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(PRICES_VERSION_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new MegaEsimError({
        code: `http_${response.status}`,
        httpStatus: response.status,
        message: `Prices version check failed with status ${response.status}`,
      });
    }

    const data = await response.json();
    return { version: String(data.version) };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof MegaEsimError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new MegaEsimError({
        code: "timeout",
        httpStatus: 408,
        message: `Prices version request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
      });
    }
    throw new MegaEsimError({
      code: "network_error",
      httpStatus: 500,
      message: err instanceof Error ? err.message : "Failed to fetch prices version",
    });
  }
}

/**
 * Creates an eSIM order with idempotency (partnerRef).
 */
export async function createOrder(params: {
  planId: string;
  quantity?: number;
  partnerRef: string;
  endUserEmail?: string;
  acceptNumberTerms?: boolean;
}): Promise<Order> {
  const body: Record<string, unknown> = {
    plan_id: params.planId,
    quantity: params.quantity ?? 1,
    partner_ref: params.partnerRef,
  };

  if (params.endUserEmail) {
    body.end_user_email = params.endUserEmail;
  }
  if (params.acceptNumberTerms) {
    body.accept_number_terms = true;
  }

  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Fetches an order by its numeric or string order ID.
 */
export async function getOrder(id: string | number): Promise<Order> {
  return request<Order>(`/orders/${encodeURIComponent(String(id))}`);
}

/**
 * Fetches an order by partner_ref.
 */
export async function getOrderByRef(ref: string): Promise<Order> {
  return request<Order>(`/orders?ref=${encodeURIComponent(ref)}`);
}

/**
 * Fetches status and details of one eSIM by ICCID.
 */
export async function getEsim(iccid: string): Promise<Esim> {
  return request<Esim>(`/esims/${encodeURIComponent(iccid)}`);
}

/**
 * Fetches QR URL and LPA string again for an eSIM.
 */
export async function getEsimQr(iccid: string): Promise<MegaEsimQrResponse> {
  return request<MegaEsimQrResponse>(`/esims/${encodeURIComponent(iccid)}/qr`);
}

/**
 * Fetches live data usage for an eSIM from the provider.
 */
export async function getEsimUsage(iccid: string): Promise<MegaEsimUsageResponse> {
  return request<MegaEsimUsageResponse>(`/esims/${encodeURIComponent(iccid)}/usage`);
}

/**
 * Cancels an UNUSED eSIM (status ready). Refunding the purchase price to the wallet.
 */
export async function cancelEsim(iccid: string): Promise<MegaEsimCancelResponse> {
  return request<MegaEsimCancelResponse>(
    `/esims/${encodeURIComponent(iccid)}/cancel`,
    {
      method: "POST",
    }
  );
}
