import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";

/**
 * Signs a document id for the internal-only /doc-render/[id] route that
 * Puppeteer navigates to when generating a PDF. That route sits outside
 * /admin (no login session to forward into a headless browser tab) and
 * outside the public /quote/[token] flow (generating a PDF must not mark
 * a quotation "viewed" by the client) — so it needs its own access
 * control. Reuses the Supabase service-role key as HMAC key material
 * rather than requiring a brand-new secret env var; this link is never
 * shown in the UI, only built server-side right before Puppeteer uses it.
 */
export function signDocumentRenderToken(documentId: string): string {
  return createHmac("sha256", getSupabaseServiceRoleKey()).update(documentId).digest("hex");
}

export function verifyDocumentRenderToken(documentId: string, token: string): boolean {
  const expected = signDocumentRenderToken(documentId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token ?? "");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
