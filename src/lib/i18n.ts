import "server-only";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  LOCALE_HREFLANG,
  SUPPORTED_LOCALES,
  localizedPath,
  type Locale,
} from "./locale-constants";

export * from "./locale-constants";

/**
 * en/ar/ur/hi locale routing (masaar-client-data-round2.md Section 5,
 * extended to ur/hi by a later instruction). English is the
 * always-available default with real content; every existing page
 * component is reused as-is for the other three (no translation exists
 * yet, so e.g. `/ar/...` renders literally the same "Copy pending"
 * placeholder content as `/en/...` — that's intentional, not a bug: see
 * the brief's "don't machine-translate, treat a missing translation like
 * the site's existing no-invented-content rule").
 *
 * Implementation: middleware.ts rewrites a non-default locale prefix
 * (`/ar/*`, `/ur/*`, `/hi/*`) to the matching unprefixed route internally
 * (so page components never need a `[locale]` param or to be duplicated)
 * and stamps the request with an `x-locale` header. Server Components
 * read it back via getRequestLocale below — that's how the SAME root
 * layout/page renders correct `<html lang>`/hreflang for `/umrah` (en),
 * `/ar/umrah`, `/ur/umrah`, and `/hi/umrah` alike.
 */
export async function getRequestLocale(): Promise<Locale> {
  const h = await headers();
  const value = h.get("x-locale");
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

/**
 * hreflang + locale-aware canonical for one logical page, given its
 * locale-independent path (e.g. "/umrah", "/"). Per
 * masaar-client-data-round2.md Section 6: each locale canonicals to
 * itself, one hreflang entry per supported locale plus x-default
 * (pointing at English) on every page.
 */
export function buildAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    languages[LOCALE_HREFLANG[l]] = `${origin}${localizedPath(l, path)}`;
  }
  languages["x-default"] = `${origin}${localizedPath(DEFAULT_LOCALE, path)}`;
  return {
    canonical: `${origin}${localizedPath(locale, path)}`,
    languages,
  };
}

/**
 * Every non-default locale currently serves word-for-word the same
 * (placeholder-heavy) English content — no real translation exists for
 * ar, ur, or hi yet. Rather than tell Google "this is the Arabic/Urdu/
 * Hindi version" while it's actually English text, all three stay
 * noindex until real translated copy exists for that specific locale.
 * Remove this per-locale once it does. This is a deliberate
 * technical-SEO judgement call, not something masaar-client-data-round2.md
 * asked for explicitly — flagged so it's easy to revisit.
 */
export function localeRobots(locale: Locale): Metadata["robots"] {
  return locale !== DEFAULT_LOCALE ? { index: false, follow: true } : undefined;
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
