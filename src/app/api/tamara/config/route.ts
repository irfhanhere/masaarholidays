import { NextResponse } from "next/server";
import { isTamaraCheckoutEnabled, getTamaraConfig } from "@/lib/tamara";

export const dynamic = "force-dynamic";

/**
 * Public Tamara availability probe endpoint.
 * Returns checkout feature status and environment without exposing any server-side secret tokens.
 */
export async function GET() {
  const config = getTamaraConfig();
  return NextResponse.json({
    enabled: isTamaraCheckoutEnabled(),
    publicKey: config.publicKey || undefined,
    environment: config.environment,
    supportedCurrencies: ["AED", "SAR"],
  });
}
