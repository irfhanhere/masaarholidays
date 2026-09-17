import "server-only";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getPageSeo } from "./data/public";
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

/**
 * One-call helper most pages use: title/description unchanged, plus
 * locale alternates + robots + Open Graph.
 *
 * `noindex` (from a page's own admin-editable page_seo/meta_* row) and
 * the existing locale-based noindex (non-English locales have no real
 * translation yet — see localeRobots above) are two independent reasons
 * a page might not want to be indexed; a page is noindexed if EITHER
 * applies, not just the locale one.
 */
export async function buildPageMetadata({
  path,
  title,
  description,
  ogImageUrl,
  noindex,
}: {
  path: string;
  title: string;
  description?: string;
  /** Absolute URL, or a root-relative path (e.g. "/brand/banners/umrah.png") resolved against NEXT_PUBLIC_SITE_URL. */
  ogImageUrl?: string | null;
  /** Admin-set noindex for this specific page — combined with (not replacing) locale-based noindex. */
  noindex?: boolean | null;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const resolvedImage = ogImageUrl ? (ogImageUrl.startsWith("http") ? ogImageUrl : `${origin}${ogImageUrl}`) : undefined;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    robots: noindex ? { index: false, follow: true } : localeRobots(locale),
    openGraph: {
      title,
      description,
      url: `${origin}${localizedPath(locale, path)}`,
      siteName: "Masaar Holidays",
      type: "website",
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
  };
}

/**
 * What every static top-level page's generateMetadata calls — looks up
 * this path's admin-editable page_seo row (Admin → Page SEO) and prefers
 * its meta_title/meta_description/og_image_url/noindex, falling back to
 * the caller's own hardcoded copy when the row is missing/empty so
 * nothing ever goes blank. Keeps the same 8 call sites from repeating
 * this fetch-then-fallback pattern individually.
 */
export async function buildStaticPageMetadata({
  path,
  fallbackTitle,
  fallbackDescription,
}: {
  path: string;
  fallbackTitle: string;
  fallbackDescription?: string;
}): Promise<Metadata> {
  const seo = await getPageSeo(path);
  return buildPageMetadata({
    path,
    title: seo?.meta_title || fallbackTitle,
    description: seo?.meta_description || fallbackDescription,
    ogImageUrl: seo?.og_image_url,
    noindex: seo?.noindex,
  });
}
