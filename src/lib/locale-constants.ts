/**
 * Locale constants with zero special imports — safe to use from
 * middleware (Edge runtime, no `next/headers`) as well as Server
 * Components. See lib/i18n.ts for the request-scoped helpers built on
 * top of this (which DO use next/headers and are server/Node-only).
 */
export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = { en: "English", ar: "العربية" };
export const LOCALE_HREFLANG: Record<Locale, string> = { en: "en-AE", ar: "ar-AE" };

/** '/' or '/umrah' -> '/ar' or '/ar/umrah' for the ar locale; unchanged for en. */
export function localizedPath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? "/ar" : `/ar${path}`;
}

/**
 * Splits an incoming pathname into { locale, internalPath } where
 * internalPath is what the (unprefixed, English-authored) route tree
 * actually serves. `/ar` -> ar + "/", `/ar/umrah` -> ar + "/umrah",
 * anything else -> en + itself unchanged.
 */
export function resolveLocaleFromPath(pathname: string): { locale: Locale; internalPath: string } {
  if (pathname === "/ar") return { locale: "ar", internalPath: "/" };
  if (pathname.startsWith("/ar/")) return { locale: "ar", internalPath: pathname.slice(3) };
  return { locale: "en", internalPath: pathname };
}
