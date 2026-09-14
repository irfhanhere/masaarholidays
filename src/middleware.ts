import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveLocaleFromPath } from "@/lib/locale-constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/** stays English-only and keeps its own auth/session logic —
  // not part of the public-site locale routing below. Guards against
  // "/ar/admin/..." too, so there's no accidental locale-prefixed alias
  // into the admin panel.
  if (pathname.startsWith("/admin") || pathname.startsWith("/ar/admin")) {
    return updateSession(request);
  }

  // Public site: `/ar/*` is internally rewritten to the same (unprefixed,
  // English-authored) route tree, tagged with an `x-locale` header that
  // layouts/pages read via lib/i18n.ts#getRequestLocale. No route files
  // are duplicated per locale — see lib/i18n.ts for the full rationale.
  const { locale, internalPath } = resolveLocaleFromPath(pathname);

  const requestHeaders = new Headers(request.headers);
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
