# SEO & Speed Fix Report: masaarholidays.com

**Execution Date:** September 30, 2026  
**Git Branch:** `seo-speed-fixes`  
**Target Domain:** `https://www.masaarholidays.com`  

---

## Executive Summary
This report tracks all SEO, technical routing, canonicalization, internationalization, metadata, structured data, image optimization, and performance fixes implemented across the project.

---

## Phase 1: Sitemap + Indexing Hygiene — Completed

### 1. Sitemap Overhaul (`src/app/sitemap.ts`)
- **Strict Filtering**: Filtered out all internal scaffold/placeholder slugs (`umrah-*-placeholder`, `hajj-signature-placeholder`) and disabled months (`july`, `august`, `september`).
- **Real Lastmod Dates**: Removed `new Date()` build-time timestamps. Every static URL now draws its `lastModified` date from its database row in `page_seo.updated_at` (with a stable fallback date). Every dynamic package, hotel, visa, departure month, journey page, blog post, and private trip derives its `lastModified` directly from `row.updated_at`.
- **Consistency**: Generated from the exact data access functions used by the public pages (`getPublishedPackages`, `getActiveHotels`, `getActiveVisaTypes`, `getActiveUmrahDepartureMonths`, `getPublishedPrivateTrips`, `getSitemapVisibleBlogPosts`).
- **Query Strings & Status**: No query strings are emitted; all URLs are self-canonical, published, indexable, and return 200.

### 2. Slug Validation & 404/301 Routing
- **Unpublished / Unknown Slugs**: In `hajj/[slug]`, `hotels/[slug]`, `visa/[slug]`, and `umrah/departures/[month]`, both `generateMetadata` and page components now call `notFound()` to issue a genuine 404 response rather than returning placeholder metadata or blanket-redirecting to hubs.
  - Retired slugs returning 404: `hajj-essential-17-days`, `hajj-essential-25-days`, `hajj-exclusive-17-days`, `hajj-exclusive-25-days`, `hajj-signature-placeholder`, `/visa/emirates-id`, and inactive hotel slugs (`grand-millennium-al-haram`, `dar-aleiman-al-haram`, `makarem-haram-view-suites-madinah`, `intercontinental-madinah-dar-al-iman`).
- **301 Redirects for Clean Replacements**:
  - `/hajj/hajj-essential-10-days` → 301 to `/hajj/hajj-essential-9-days` (direct 9-night/10-day Essential shifting package).
  - `/hajj/hajj-signature-10-days` → 301 to `/hajj/hajj-signature-9-days` (direct 9-night/10-day Signature shifting package).
  - `/umrah/umrah-essential-placeholder` → 301 to `/umrah/essential`.
  - `/umrah/umrah-signature-placeholder` → 301 to `/umrah/signature`.
  - `/umrah/umrah-exclusive-placeholder` → 301 to `/umrah/exclusive`.

### 3. Placeholder Routes
- `umrah-*-placeholder`: Added `noindex: true` metadata protection when requested directly; redirects seamlessly to clean tier routes (`/umrah/essential`, `/umrah/signature`, `/umrah/exclusive`).
- `hajj-signature-placeholder`: Returns a 404 via `notFound()` in production.

### 4. Apex and HTTP Redirection Verification
- Added host-level 301 redirect in `next.config.ts`:
  Requests with host `masaarholidays.com` automatically 301 redirect to `https://www.masaarholidays.com/:path*`.
- **How to verify on production via terminal:**
  ```bash
  # 1. Verify HTTP apex redirects to HTTPS www:
  curl -I http://masaarholidays.com/

  # 2. Verify HTTP www redirects to HTTPS www:
  curl -I http://www.masaarholidays.com/

  # 3. Verify HTTPS apex redirects to HTTPS www:
  curl -I https://masaarholidays.com/

  # 4. Verify HTTPS www returns 200 with strict security headers:
  curl -I https://www.masaarholidays.com/
  ```
  Expected output for commands 1-3 is `HTTP/1.1 301 Moved Permanently` (or `308 Permanent Redirect`) with `location: https://www.masaarholidays.com/`.

### 5. Investigation: Why Google Canonicalised `/hajj` Elsewhere
- **Root Cause Analysis**:
  1. **Thin & Duplicated Content**: Previously, `/hajj` only rendered a grid of package cards (`HajjPackageGrid`) and lead capture forms without its own substantive editorial text. The cards repeated the exact same package titles, hotel names, and inclusions text present on `/hajj/hajj-exclusive-10-days` and `/hajj/hajj-essential-9-days`. Google perceived the listing hub as near-duplicate content of the package pages.
  2. **Ghost Referring URLs**: Google crawled retired URLs like `/hajj/hajj-essential-10-days` which had neither 301 redirects nor strict 404 headers in `generateMetadata`, causing canonical ambiguity.
  3. **Hreflang Pollution**: `/hajj` emitted hreflang tags to `/ar/hajj`, `/ur/hajj`, and `/hi/hajj` which had identical English text with `noindex`.
- **Resolution Implemented**:
  1. Enriched `/hajj` with a comprehensive editorial guide: "Understanding Hajj Options: Shifting vs. Non-Shifting", detailing logistical differences for UAE pilgrims between staying in Aziziyah during Tashreeq versus retaining continuous Clock Tower rooms.
  2. Added a comparative breakdown table across all three Hajj tiers (Essential, Signature, Exclusive) comparing accommodation, camps, and duration.
  3. Enforced explicit self-canonical (`https://www.masaarholidays.com/hajj`) and removed untranslated hreflang variants.
  4. Added 301 redirects from legacy referring URLs (`hajj-essential-10-days` → `hajj-essential-9-days`).

## Phase 2: Package URLs and Canonicals
- [Pending]

## Phase 3: Locales & Hreflang
- [Pending]

## Phase 4: Metadata, Headings & Document Hierarchy
- [Pending]

## Phase 5: Content, FAQ & Structured Data (JSON-LD)
- [Pending]

## Phase 6: Image Replacement, Optimization & Core Web Vitals
- [Pending]

## Phase 7: Verification & Lighthouse Audit Evidence
- [Pending]
