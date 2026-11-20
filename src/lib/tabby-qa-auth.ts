import { NextRequest } from "next/server";

/**
 * Returns the list of authorized QA passkeys configured on the server.
 * Never exposed to client bundles or browser runtime.
 */
export function getAuthorizedQaKeys(): string[] {
  return [
    process.env.TABBY_QA_ACCESS_KEY?.trim(),
    process.env.ESIM_PREVIEW_KEY?.trim(),
    process.env.CRON_SECRET?.trim(),
  ].filter((k): k is string => Boolean(k && k.length > 0));
}

/**
 * Validates whether an incoming HTTP request is authorized to perform Tabby QA limit testing.
 * Checks HTTP headers, secure cookies, JSON body payload, or URL query parameters.
 */
export function isAuthorizedQaRequest(req: NextRequest, body?: Record<string, unknown>): boolean {
  const validKeys = getAuthorizedQaKeys();
  if (validKeys.length === 0) {
    return false;
  }

  // 1. Check custom QA authorization header
  const headerKey = req.headers.get("x-qa-key")?.trim();
  if (headerKey && validKeys.includes(headerKey)) {
    return true;
  }

  // 2. Check standard Authorization: Bearer <key> header
  const authHeader = req.headers.get("authorization")?.trim();
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (validKeys.includes(bearerToken)) {
      return true;
    }
  }

  // 3. Check secure QA session cookie
  const cookieKey = req.cookies.get("tabby_qa_auth")?.value?.trim();
  if (cookieKey && validKeys.includes(cookieKey)) {
    return true;
  }

  // 4. Check JSON body qaKey / passkey
  if (body && typeof body === "object") {
    const bodyKey = (body.qaKey || body.key || body.passkey);
    if (typeof bodyKey === "string" && validKeys.includes(bodyKey.trim())) {
      return true;
    }
  }

  // 5. Check URL query parameters (?qa_key=... or ?key=...)
  const queryKey =
    req.nextUrl.searchParams.get("qa_key")?.trim() ||
    req.nextUrl.searchParams.get("key")?.trim();
  if (queryKey && validKeys.includes(queryKey)) {
    return true;
  }

  return false;
}
