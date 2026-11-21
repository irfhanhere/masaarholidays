import { NextResponse } from "next/server";
import { isTabbyCheckoutEnabled, getTabbyConfig } from "@/lib/tabby";

export const dynamic = "force-dynamic";

/**
 * Public Tabby availability probe endpoint.
 * Returns checkout feature status and regional currency availability without exposing any secrets.
 */
export async function GET() {
  const config = getTabbyConfig();
  // Tabby is temporarily removed from the customer-facing website while updates continue.
  return NextResponse.json({
    enabled: false,
    sarAvailable: config.isSarAvailable,
    environment: config.environment,
  });
}
