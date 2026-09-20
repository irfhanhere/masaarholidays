import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveLocaleFromPath } from "@/lib/locale-constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Resolve locale first so the /admin guard automatically covers every
  // supported locale's prefix ("/ar/admin", "/ur/admin", "/hi/admin", …)
  // without listing them one by one.
  const { locale, internalPath } = resolveLocaleFromPath(pathname);

  // Stamped on every request (admin included) so the root layout — which
  // renders both the public site and /admin/** through the same <body>,
  // with no separate boundary — can tell admin traffic apart from public
  // traffic without its own pathname-matching logic. Currently used to
  // keep GA4 (app/layout.tsx) off admin pages; x-locale below is public-
  // site-only since /admin/** isn't locale-routed.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // /admin/** stays English-only and keeps its own auth/session logic —
  // not part of the public-site locale routing below. No locale-prefixed
  // alias into the admin panel, so no x-locale header here.
  if (internalPath.startsWith("/admin")) {
    return updateSession(request, requestHeaders);
  }

  // Public site: a non-default locale prefix (e.g. `/ar/*`) is internally
  // rewritten to the same (unprefixed, English-authored) route tree,
  // tagged with an `x-locale` header that layouts/pages read via
  // lib/i18n.ts#getRequestLocale. No route files are duplicated per
  // locale — see lib/i18n.ts for the full rationale.
  requestHeaders.set("x-locale", locale);

  if (internalPath !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    /*
     * Run on every route except static assets, so /admin/** gets its
     * Supabase auth gate and every public route gets locale resolution.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
