import { NextRequest, NextResponse } from "next/server";
import { refreshEsimFxRates } from "@/lib/esim-fx";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * Validates request authorization using CRON_SECRET.
 * Supports:
 * - Authorization: Bearer <CRON_SECRET>
 * - x-cron-secret: <CRON_SECRET>
 * - URL query parameter: ?key=<CRON_SECRET>
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[esim-fx-refresh] CRON_SECRET is not configured in production environment!");
      return false;
    }
    return true;
  }

  const authHeader = request.headers.get("authorization")?.trim();
  const xSecretHeader = request.headers.get("x-cron-secret")?.trim();
  const queryKey = request.nextUrl.searchParams.get("key")?.trim();

  if (authHeader && authHeader.toLowerCase() === `bearer ${secret.toLowerCase()}`) {
    return true;
  }

  if (xSecretHeader && xSecretHeader === secret) {
    return true;
  }

  if (queryKey && queryKey === secret) {
    return true;
  }

  return false;
}

async function handleRefresh(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshEsimFxRates();
    const status = result.ok ? 200 : 207;
    return NextResponse.json(
      {
        ok: result.ok,
        source: result.source,
        fetched_at: result.fetchedAt,
        rates: result.rates,
        error: result.error,
      },
      { status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[esim-fx-refresh] Uncaught error during FX refresh:", message);
    return NextResponse.json(
      { ok: false, error: "Internal server error during exchange rates refresh." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}

export async function GET(request: NextRequest) {
  return handleRefresh(request);
}
