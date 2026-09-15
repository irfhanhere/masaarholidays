/**
 * Locale constants with zero special imports — safe to use from
 * middleware (Edge runtime, no `next/headers`) as well as Server
 * Components. See lib/i18n.ts for the request-scoped helpers built on
 * top of this (which DO use next/headers and are server/Node-only).
 *
 * English is the only locale with real, translated content — ar/ur/hi
 * exist as routing/SEO infrastructure ahead of translation (same
 * "Copy pending" pattern already used for missing marketing copy, not
 * machine-translated text presented as finished). Adding a locale here
 * is deliberately the ONLY code change needed to extend routing,
 * hreflang, noindex, and dir to it — see lib/i18n.ts#buildAlternates and
 * #localeRobots, and components/site/LanguagePrompt.tsx (the sole
 * language-switch UI — there's no persistent manual switcher).
 */
export const SUPPORTED_LOCALES = ["en", "ar", "ur", "hi"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  ur: "اردو",
  hi: "हिन्दी",
};

/** Short code shown in the footer switcher, e.g. "EN". */
export const LOCALE_CODE: Record<Locale, string> = { en: "EN", ar: "AR", ur: "UR", hi: "HI" };

/** hreflang value per locale — "-AE" throughout: every locale targets the UAE audience, per masaar-client-data-round2.md Section 6. */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  en: "en-AE",
  ar: "ar-AE",
  ur: "ur-AE",
  hi: "hi-AE",
};

/** Text direction for <html dir>. ar and ur are RTL scripts; en and hi are LTR. */
export const LOCALE_DIR: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
  ur: "rtl",
  hi: "ltr",
};

/** '/' or '/umrah' -> '/ar' or '/ar/umrah' for a non-default locale; unchanged for the default (English, unprefixed). */
export function localizedPath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

const NON_DEFAULT_LOCALES = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE);

/**
 * Splits an incoming pathname into { locale, internalPath } where
 * internalPath is what the (unprefixed, English-authored) route tree
 * actually serves. `/ar` -> ar + "/", `/ar/umrah` -> ar + "/umrah", same
 * for every other non-default locale; anything else -> the default
 * locale + itself unchanged.
 */
export function resolveLocaleFromPath(pathname: string): { locale: Locale; internalPath: string } {
  for (const locale of NON_DEFAULT_LOCALES) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return { locale, internalPath: "/" };
    if (pathname.startsWith(`${prefix}/`)) return { locale, internalPath: pathname.slice(prefix.length) };
  }
  return { locale: DEFAULT_LOCALE, internalPath: pathname };
}
