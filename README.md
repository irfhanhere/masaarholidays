# Masaar Holidays — Website

Next.js (App Router) + Tailwind CSS + Supabase, built against the approved
screens in `/inspirations` and the two brief documents:

- `masaar-holidays-website-brief.md`
- `masaar-holidays-content-seo-starter-kit.md`

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — brand tokens (colours, Montserrat/Cormorant Garamond) in `src/app/globals.css`
- **Supabase** — Postgres, Auth (admin login), Row Level Security. Client/server helpers in `src/lib/supabase/`

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's values
npm run dev
```

The **public site runs immediately**, even before `.env.local` is filled in
— pages fall back to an empty state instead of crashing (see
`isSupabaseConfigured()` in `src/lib/supabase/env.ts`). The **admin panel
(`/admin`) needs Supabase connected** to do anything (auth, all CRUD).

### Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings → API → copy the URL, `anon` key and `service_role`
   key into `.env.local` (never commit this file — it's gitignored).
3. Run the SQL in `supabase/migrations/` against your project, **in
   filename order (0001, 0002, 0003, …) — each one depends on the tables
   the previous ones create.** Easiest path: Supabase Dashboard → SQL
   Editor → paste one file, Run, then the next. Or, if you have the CLI
   linked:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   Claude Code cannot run these for you — it only has the project's API
   keys (anon/service_role), which PostgREST never accepts schema
   changes through, by design. Only the SQL Editor / CLI (which use your
   Postgres credentials) can apply migrations.
4. Create your first admin user: Supabase Dashboard → Authentication →
   Users → Add User. (There is no public sign-up — Phase 1 has admin-only
   accounts, per the brief.)
5. Sign in at `/admin/login`.

**On this machine specifically:** a Windows Application Control policy
blocks Turbopack's native binary
(`node_modules/@next/swc-win32-x64-msvc/*.node`). `next dev` / `next build`
fall back to WASM and then fail outright unless you add `--webpack`
(`npm run dev -- --webpack`, `npm run build -- --webpack`) — this is a
machine/policy issue, not a project issue, so it's not baked into
`package.json`'s scripts (Turbopack works normally in CI/Vercel and on
machines without that policy).

## Database schema

`supabase/migrations/0001_init.sql` — packages (tiers + Plus upgrades),
hotels, transfers, visa content (4 document-set contexts), testimonials
(draft/published), enquiries, currency_rates, plus Row Level Security
policies (public reads only published/active rows; all writes require an
authenticated admin session).

`supabase/migrations/0002_seed_visa_contexts.sql` — seeds the 4 required
visa document contexts as empty shells (no copy).

`0003_seed_makkah_hotels.sql` — the 19 Makkah hotels from
masaar-client-data-round2.md Section 1 (seeded `is_active = false` —
review + activate each from Admin → Hotels once photos/categories are
confirmed, per the source's own "VERIFY BEFORE PUBLICATION" flag).

`0004_hotel_filters.sql` — adds `cancellation_policy` + `view_type` to
`hotels` (Section 2 filter dimensions; `board_basis` already existed).

`0005_transfer_rate_card.sql` + `0006_seed_transfer_rate_card.sql` — the
vehicle fleet, the 12-route rate card, and a public-safe view that never
selects `price_aed` (Section 3 — prices are admin-only by construction,
not just hidden in the UI).

`0007_package_transfer_addons.sql` — lets a package attach specific
transfer routes/vehicles as add-ons (Section 3).

`0008_hotel_walk_terrain.sql` — real walk-time/distance/terrain data
(masaar-client-data-round3.md Section 1) for 18 of the 19 Round 2 hotels
(all but Elaf Kinda, which the source doesn't cover), reconciling 4 of
them against Round 3's slightly different names rather than inserting
duplicates (see the comment at the top of the file), plus 11 more new
Makkah hotels (seeded inactive, same pattern as 0003).

`0009_hotel_rooms.sql` + `0010_seed_hotel_rooms.sql` — a `hotel_rooms`
table (one hotel, many room types) and the 17 real room prices from the
Oct 1–30, 2026 rate sheet (Section 2), matched to hotels via the same
reconciliation.

`0011_seed_placeholder_packages.sql` — 6 sample Umrah/Hajj packages
(Essential/Signature/Privé × 2) with placeholder pricing (Section 4),
seeded `is_active = false` — visible in Admin → Packages for
layout-testing, never on the public Umrah/Hajj pages.

`0012_package_extra_fields.sql` — adds `duration_label`, `validity_label`,
`inclusions_text`, `advance_booking_note`, `flight_note`,
`rate_disclaimer` to `packages`, and populates the 6 placeholder packages
with tier-appropriate text (Essential/Signature/Privé's own positioning
from the original brief — not invented pricing/hotel specifics; no
specific dates either, since none are confirmed yet).

**0001–0007 have been applied to the live project already (verified);
0008–0012 have not yet** — write them, verify them, but don't assume the
data is live until you've run them (Step 3 above). The app degrades
gracefully either way (empty states, not crashes) if you view it before
running a given migration — that's deliberate, not a bug to chase.

Regenerate `src/lib/types/database.ts` from the live schema once connected:

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts
```

**Note if you regenerate:** the Supabase CLI's generated types use
`interface` for row shapes. In this project's dependency versions that
breaks `.insert()`/`.update()` type inference (Postgrest resolves to
`never`) — convert generated row interfaces to `type` aliases, or keep
using the hand-written file. See the comment at the top of
`database.ts` for the isolated repro if this needs revisiting.

## What's built vs. scaffolded

**Public site** — all 8 nav pages + footer/system pages exist and are
styled to match the approved designs (header, footer, hero pattern, cards,
WhatsApp CTAs). Marketing/paragraph copy is deliberately left as visible
"Copy pending" placeholders — nothing is invented; see brief Part 5 and
the "Ask me before writing any page copy" instruction. Approved SEO
titles/H1s/meta descriptions from the starter-kit *are* wired in, since
those are already-approved deliverables, not pending copy.

**Admin panel** — fully wired (Supabase-backed CRUD): Dashboard, Packages
(incl. Plus-upgrade toggle + room pricing), Hotels, Transfers, Visa
Content (per-context documents + caveat), Testimonials (draft/published
workflow, consent gate), Enquiries (list + detail), Currency & Pricing,
Login/session.

Scaffolded (sidebar route exists, matching `/inspirations` filename noted
on-screen, not yet wired): WhatsApp Templates, Home & About Content, Blog
CMS, Media Library, Page SEO, Legal & Cookies editor, Admin Users,
Password & 2FA. None of these need schema changes beyond what's already
here except Blog (needs a `blog_posts` table — out of scope for the
requested schema) and Media Library (needs Supabase Storage buckets).

## Round 2 (masaar-client-data-round2.md)

- **19 Makkah hotels** seeded (0003), inactive pending review — see above.
- **Hotel filters** — `src/components/site/HotelsBrowser.tsx` derives Board
  Basis / Cancellation Policy / View checkboxes from whatever distinct
  values exist on active hotels (not hardcoded), with live faceted
  counts. Hides itself entirely while no hotel has any of these fields
  set (true today, until 0003's hotels get reviewed and tagged).
- **Transfers — no public prices.** `transfer_route_rates` (the actual
  AED numbers) has no public RLS policy at all — the anon key literally
  cannot query it, not just "the UI doesn't show it". The public
  Transfers page reads `transfer_route_available_vehicles`, a view that
  never selects a price column. Admin's Rate Card
  (`/admin/transfers/rate-card`) is the one place prices are visible and
  editable.
- **Transfer add-on on packages** — `package_transfer_addons` +
  Package Edit's new "4. Transfer Add-on" section. Not yet surfaced on
  the public package card/page — admin-side only, matching what was asked.
- **English + Arabic routing** — see next section.

## Round 3 (masaar-client-data-round3.md)

- **Hotel walk-time/terrain data** — real distance/walk-time/terrain
  replaces the vague category label on cards and the new
  `/hotels/[slug]` detail page (falls back to `category` when
  `terrain_note` isn't set — see `HotelCard.tsx`). 4 Round 2 hotels were
  reconciled to Round 3's slightly different names (updated in place, no
  duplicates) per the source's own naming table.
- **Hotel detail page** (`/hotels/[slug]`) — hero, proximity info, a room
  list from `hotel_rooms` with a per-room "Enquire about this room"
  WhatsApp CTA (pre-filled hotel + room type), and a sticky "Enquire
  about this hotel" CTA for the property overall. Listing cards
  (`HotelCard.tsx`) now link through via "View Rooms", alongside (not
  instead of) their own WhatsApp button.
- **No admin UI for editing individual `hotel_rooms` rows yet** — wasn't
  asked for in this pass; rows are managed via the SQL Editor/Supabase
  Studio for now. Worth a follow-up admin screen once room data is
  edited often.
- **Placeholder packages** — see above. `rate_period_label` (e.g. "Oct
  1-30, 2026") keeps the date-bound room pricing visibly scoped rather
  than presented as a permanent rate — no seasonal-pricing engine was
  built, per the source's own explicit "don't build this unless asked."
- **Price Match widget — deliberately not built.** Section 5 flagged it
  as an unapproved business commitment (a 12-hour response-time promise)
  — left out entirely pending Haseeb's explicit sign-off, per the source
  document's own instruction.

## Package detail pages (`/umrah/[slug]`, `/hajj/[slug]`)

Same two-CTA pattern as the hotel detail page, translated to packages:
room-type rows (from `package_room_prices`, same table the room pricing
card already used) each get their own "Enquire about this room option"
WhatsApp deep-link, plus one sticky "Enquire about this package" CTA for
the package overall — using the tier-specific templates
(`umrahEssential`/`umrahSignature`/`umrahPrive`) for Umrah and the single
generic template for Hajj (the brief only gives one Hajj message, no tier
variants — see `packageGeneralMessage()` in `lib/whatsapp-templates.ts`).
Listing cards (`PackageCard.tsx`) now link through via "View Details",
alongside their existing WhatsApp button — same pattern as `HotelCard.tsx`.
While fixing that link-through I also fixed a pre-existing bug:
`PackageCard` was using Umrah-tier WhatsApp messages for Hajj packages
too; it now branches on the package's own `type`.

Verified end-to-end against the live database: temporarily inserted a
real package + room prices via the service-role key (the new
`duration_label`/`validity_label`/etc. columns don't exist yet since
0012 hasn't been applied, so this test used only the columns that do),
confirmed the detail page, per-room CTAs, and listing card link-through
all render correctly, then deleted it — nothing was left behind.

## Language routing (English + Arabic + Urdu + Hindi)

No page files are duplicated per locale. `middleware.ts` rewrites a
non-default locale prefix (`/ar/*`, `/ur/*`, `/hi/*`) internally to the
same unprefixed route tree and stamps an `x-locale` request header;
`lib/i18n.ts#getRequestLocale()` reads it back in Server Components (root
`layout.tsx` for `<html lang/dir>`, every public page's `generateMetadata`
for hreflang/canonical via `buildPageMetadata()`). Practical effect:
`/ar/umrah`, `/ur/umrah`, and `/hi/umrah` all render the exact same Umrah
page component as `/umrah`, each correctly tagged with its own
`lang`/`dir` — same "Copy pending" placeholders, no invented translated
text for any of them.

Everything is driven off `SUPPORTED_LOCALES` in `lib/locale-constants.ts`
(currently `["en", "ar", "ur", "hi"]`, English the default) plus three
per-locale maps next to it — `LOCALE_DIR` (ar/ur are RTL, en/hi are LTR),
`LOCALE_HREFLANG` (`{locale}-AE`, all four target the UAE audience), and
`LOCALE_LABEL`/`LOCALE_CODE` (native name / short code for the UI).
Adding a 5th real locale is meant to be just another entry in
`SUPPORTED_LOCALES` + those maps — routing, `<html lang/dir>`, hreflang,
noindex, and both switcher/prompt components all read from them rather
than special-casing "ar" anywhere.

- **No persistent language switcher anywhere — header or footer.**
  `LanguagePrompt.tsx` is the ONLY way a visitor is offered a switch: a
  one-time, browser-language-detected banner (same idea as a browser's
  native translate bar — it offers, it never forces, and there's no
  standing manual control sitting in the chrome). Locale-count-agnostic:
  it finds the visitor's most-preferred browser language that matches
  one of `SUPPORTED_LOCALES` and, if that's not the locale currently
  being viewed, offers it — in any direction (English -> Urdu, Hindi ->
  Arabic, etc.), falling back to offering English back when the browser
  doesn't match any of the four at all. Never auto-redirects, and a
  dismissal is remembered in `localStorage`
  (`masaar-language-prompt-dismissed`) so it doesn't reappear on every
  page load — verified live by dismissing it and reloading. (There was
  briefly a small footer-only `LanguageSwitcher.tsx` fallback for anyone
  who dismissed the prompt; a later instruction removed that too, so it
  no longer exists in the codebase — resurrect it from git history if a
  manual control is wanted again rather than rebuilding from scratch.)
- **`LanguagePrompt`'s switch action uses a real `window.location`, not
  `router.push`.** Root `layout.tsx` computes `<html lang/dir>`
  server-side from the `x-locale` header, and Next reuses the cached
  root layout across a client-side transition between locale prefixes
  (they're the same underlying route once the middleware rewrite
  resolves) — `router.push` there left `lang`/`dir` stale until a manual
  reload. Caught this live while the manual switcher still existed; a
  full navigation is what actually keeps them correct.
- `/ar/*`, `/ur/*`, and `/hi/*` are all `noindex` until real translated
  copy exists for that specific locale — a deliberate call (see the
  comment in `lib/i18n.ts#localeRobots`) so hreflang doesn't tell Google
  "this is the Arabic/Urdu/Hindi version" of what's actually English
  text. Flip it per-locale once real translation lands for that one.
- **RTL (ar, ur) is document-direction-correct, not visually re-flowed.**
  `dir="rtl"` is set correctly and the browser's default RTL flow
  mirrors most of the layout reasonably well (flexbox rows reverse
  automatically), but no pass was done converting physical Tailwind
  utilities (`ml-`, `pl-`, `text-left`) to logical ones (`ms-`, `ps-`,
  `text-start`) — some spacing will look slightly off in RTL until that
  pass happens. Verified live: `/ur/hotels/conrad-jabal-omar` renders
  `dir="rtl"`, `/hi/hotels/conrad-jabal-omar` renders `dir="ltr"`, both
  with correct self-canonical + all 4 hreflang alternates + `x-default`
  + `noindex, follow` in the actual page source.
- Locale-aware links: Header + Footer nav are localized. Not yet done:
  in-page links (Hero breadcrumbs, hotel page `#makkah`/`#madinah`
  anchors are fine since they're fragments, but a hardcoded `/contact`
  href inside page body copy would drop back to English) — low-traffic
  spots, flagged rather than silently left.
- Every public page now reads `headers()` (for locale), so pages that
  were previously statically prerendered are now server-rendered on
  every request. Reasonable trade-off for correct hreflang; revisit with
  ISR/PPR if it matters at scale.

## Currency conversion (display-layer only)

`CurrencyProvider` (`src/components/site/CurrencyProvider.tsx`, wrapping
the whole `(site)` layout) fetches `currency_rates` once client-side
(public RLS read) and holds the visitor's chosen display currency —
persisted per-browser in `localStorage`, read back after mount rather
than in a `useState` initializer, specifically to avoid a hydration
mismatch (server always renders AED first, since there's no
`localStorage` on the server). `CurrencySwitcher` reads/writes that same
context instead of its own local state now.

Every price on the site goes through `<Price amountAed={...} />`
(`src/components/site/Price.tsx`), which converts using
`rate_to_aed` (documented on the admin Currency & Pricing screen as
"Rate (to 1 AED)") and falls back to AED with a small "(rate
unavailable)" note — never `$0`, never a crash — when the selected
currency has no row in `currency_rates` yet. **Stored/quoted prices stay
AED everywhere** (database, admin screens, WhatsApp message text) — this
is purely what's rendered to a visitor.

Wired into: `HotelCard` (from-price), the hotel detail page (RO/BB room
prices), `PackageCard` (from-price + room price list), and the package
detail page (per-room prices). Verified live against the real database:
temporarily deleted the GBP rate to confirm the fallback note actually
appears instead of `£0`, then restored it exactly; also temporarily
inserted/deleted a real package to confirm USD/INR conversions matched
the seeded rates precisely (1,000 AED → $272 / ₹22,482) before removing
it. Nothing was left behind either way.

## WhatsApp templates (admin-editable)

The 12 pre-filled WhatsApp message templates (brief Part 6) live in the
`whatsapp_templates` table (`supabase/migrations/0013_whatsapp_templates.sql`,
seeded by `0014_seed_whatsapp_templates.sql` with the exact text that used
to be hardcoded in `src/lib/whatsapp-templates.ts` — nothing changed for
visitors when this migration ran). The destination number (wa.me deep
link) is a separate one-row `whatsapp_settings` table, editable on the
same screen.

- `src/lib/whatsapp-templates.ts` now only holds the fixed list of keys
  (`WHATSAPP_TEMPLATE_KEYS`), the hardcoded `WHATSAPP_TEMPLATE_DEFAULTS`
  (used as a fallback — see below), and `interpolate()` for `{{token}}`
  substitution. It's no longer read directly by page components.
- `WhatsAppTemplatesProvider` (`src/components/site/`, wraps the `(site)`
  layout, the admin dashboard layout, and the standalone `/maintenance`
  page) fetches both tables once client-side on mount (public RLS read)
  and exposes `useWhatsAppTemplates()` — every `<WhatsAppButton
  templateKey="..." params={{...}} />` resolves its message and the
  destination number from that context. Because the fetch happens fresh
  each page load, an admin edit shows up for visitors on their next page
  load — no rebuild or redeploy needed.
- If a key's DB row is missing or the fetch fails, `getMessage()` falls
  back to `WHATSAPP_TEMPLATE_DEFAULTS[key]` rather than crashing or
  sending a blank message; the destination number falls back to
  `WHATSAPP_DEFAULT_PHONE`.
- `is_active` in the admin screen is a status label only, not a
  visibility gate — the public RLS read (`whatsapp_templates_public_read`)
  returns every row unconditionally, because every key is required by a
  live CTA somewhere on the site. Toggling it off doesn't hide the
  button; it's there for Haseeb to flag a template that needs review.
- `upgradeToPlus` is seeded but not yet wired to any button — reserved
  for a future Plus-upgrade CTA (brief mentions the upgrade path but no
  page implements it yet).
- The Enquiries admin detail page's "WhatsApp" action uses a personalized
  per-lead greeting (`Assalamu Alaikum {name}, thank you...`) built with
  `buildWhatsAppLink()` directly — it's not one of the 12 managed
  template keys, since it's specific to each enquiry rather than a fixed
  CTA copy.

**Migrations 0013 and 0014 have not been applied to the live database yet**
(I can only run DML via the service-role key, not DDL) — run them via the
Supabase SQL Editor or `supabase db push` before this feature works live.

## Known simplifications (flagged for a follow-up pass)

- Image fields are plain URL inputs — Supabase Storage upload UI isn't wired yet.
- Package itinerary is a simple one-line-per-day textarea, not the full
  multi-item day accordion in `ADMIN-PACKAGE-EDIT.png`.
- Enquiry detail is its own page, not the slide-over panel in
  `ADMIN-EQNUIRIES.png`.
