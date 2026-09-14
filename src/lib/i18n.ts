import "server-only";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALE_HREFLANG, localizedPath, type Locale } from "./locale-constants";

export * from "./locale-constants";

/**
 * English + Arabic locale routing (masaar-client-data-round2.md, Section
 * 5). English is the always-available default and every existing page
 * component is reused as-is for Arabic (no translation exists yet, so
 * `/ar/...` renders literally the same "Copy pending" placeholder
 * content as `/en/...` — that's intentional, not a bug: see the brief's
 * "don't machine-translate, treat a missing translation like the site's
 * existing no-invented-content rule").
 *
 * Implementation: middleware.ts rewrites `/ar/*` requests to the
 * matching unprefixed route internally (so page components never need a
 * `[locale]` param or to be duplicated) and stamps the request with an
 * `x-locale` header. Server Components read it back via getRequestLocale
 * below — that's how the SAME root layout/page renders correct
 * `<html lang>`/hreflang for both `/umrah` (en) and `/ar/umrah` (ar).
 */
export async function getRequestLocale(): Promise<Locale> {
  const h = await headers();
  return h.get("x-locale") === "ar" ? "ar" : DEFAULT_LOCALE;
}

/**
 * hreflang + locale-aware canonical for one logical page, given its
 * locale-independent path (e.g. "/umrah", "/"). Per
 * masaar-client-data-round2.md Section 6: each locale canonicals to
 * itself, en-AE + ar-AE + x-default (pointing at English) on every page.
 */
export function buildAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    canonical: `${origin}${localizedPath(locale, path)}`,
    languages: {
      [LOCALE_HREFLANG.en]: `${origin}${localizedPath("en", path)}`,
      [LOCALE_HREFLANG.ar]: `${origin}${localizedPath("ar", path)}`,
      "x-default": `${origin}${localizedPath("en", path)}`,
    },
  };
}

/**
 * Arabic currently serves word-for-word the same (placeholder-heavy)
 * English content — no real translation exists yet. Rather than tell
 * Google "this is the Arabic version" while it's actually English text,
 * /ar/* stays noindex until real Arabic copy exists. Remove this once it
 * does. This is a deliberate technical-SEO judgement call, not something
 * masaar-client-data-round2.md asked for explicitly — flagged so it's
 * easy to revisit.
 */
export function localeRobots(locale: Locale): Metadata["robots"] {
  return locale === "ar" ? { index: false, follow: true } : undefined;
}

/** One-call helper most pages use: title/description unchanged, plus locale alternates + robots. */
export async function buildPageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description?: string;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    robots: localeRobots(locale),
  };
}
