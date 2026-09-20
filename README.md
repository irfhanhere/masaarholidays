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

## Package duration variants (multiple nights per tier)

Each tier (Essential/Signature/Privé, Umrah and Hajj) can now offer more
than one duration option — e.g. Essential Umrah at 7, 10 and 14 nights —
as sibling rows in the same flat `packages` table
(`supabase/migrations/0015_package_duration_variants.sql`), rather than a
new normalized "tier" parent table. Grouping is simply "same `type` +
`tier`"; nothing about how `lib/data/public.ts`, `PackageCard`, or
`PackageDetail` query or render packages had to change — they already
`select("*")` and none of them read the new column, so the public site
is unaffected by this migration.

- **`duration_nights`** (new column, not null) is the distinguishing
  field between sibling duration rows — `duration_days` is kept as
  `duration_nights + 1` (matches the "N Nights / N+1 Days" convention
  already used by `duration_label`, e.g. Essential Umrah's existing
  `duration_days=7` backfilled to `duration_nights=6`). A unique index on
  `(type, tier, duration_nights)` stops two identical-duration rows from
  being created in the same tier by mistake.
- **Tier-level copy is entered once, not duplicated per duration.**
  `title`, `city_destination`, `inclusions_text`,
  `advance_booking_note`, `flight_note`, `rate_disclaimer`,
  `validity_label` and `is_featured` are kept in sync across every
  sibling row of the same `(type, tier)` by `savePackage()`
  (`app/admin/(dashboard)/packages/actions.ts`) — saving any one
  duration's form updates that copy on all its siblings too. This is a
  synced-write, not a foreign key to a separate table, so every existing
  query/component kept working unchanged.
- **Everything else stays per-duration and independent**, per Haseeb's
  requirement that one duration can go live before another: `is_active`/
  `show_on_website`, `slug`, `duration_nights`/`duration_label`,
  `hero_image_url`, itinerary, room pricing (`package_room_prices`) and
  hotel selections (`package_hotels` — already keyed by `package_id`, so
  this needed no schema change at all).
- **Admin Packages screen** (`/admin/packages`) now groups rows into one
  card per tier (shortest duration first) with a **+ Add Duration**
  action that opens the "new package" form pre-filled from an existing
  sibling's tier-level copy (`new/page.tsx`'s `cloneFrom` param) — the
  admin only has to set the new nights count, slug-affecting fields,
  hotels and pricing. New duration rows always start
  `is_active = false` / `show_on_website = false` regardless of the
  source sibling's status, matching the existing 6 placeholder packages
  — real pricing is still pending from the client. The regular
  "+ Add Package" flow (a brand-new tier) is untouched and still
  defaults `is_active` to `true`, per "don't change existing defaults."
- New rows get an auto-generated, readable slug —
  `{type}-{tier}-{nights}-nights` (e.g. `umrah-essential-7-nights`) —
  guaranteed unique by construction since it mirrors the DB's
  `(type, tier, duration_nights)` unique constraint.

**Migration 0015 has not been applied to the live database yet** — same
constraint as every other schema change in this project (I can only run
DML via the service-role key, not DDL). Verified via the service-role
key that the public `/umrah`, `/hajj`, and `/umrah/[slug]` pages render
exactly as before against the current (pre-migration) database, since no
public-facing code path was touched — nothing to re-verify there once
0015 is applied. The admin CRUD changes (grouped list, Add Duration,
tier-copy sync) need Supabase auth to test end-to-end and couldn't be
exercised live in this pass; typecheck (`npx tsc --noEmit`) and lint
(`npx eslint .`) both pass clean.

## Umrah departure months

A "Departure Month" browsing layer for Umrah only (not Hajj), matching a
pattern from a competitor reference site — a header nav dropdown of
months, each with its own landing page. Months are a content/marketing
wrapper, not a pricing dimension: every month page shows the exact same
Essential/Signature/Privé package grid (with duration variants) already
on `/umrah` — no package data is duplicated or scoped by month anywhere.

- **`umrah_departure_months`** (`supabase/migrations/0016_umrah_departure_months.sql`):
  `slug`, `display_label`, `hero_image_url`, `hero_headline`,
  `hero_subtext`, `best_for_note`, `booking_advice_note`, `sort_order`,
  `is_active`. Seeded with all 12 months (January–December) as inactive,
  generic placeholders — no year is assumed anywhere in the seed or the
  admin form; Haseeb sets `display_label`/`slug` directly per row (e.g.
  renaming "January" to "January 2027") when he activates a real
  departure period, or adds further rows for other years.
- **`/umrah/departures/[slug]`** (`app/(site)/umrah/departures/[slug]/page.tsx`):
  hero (falls back to the standard Umrah banner/headline when a field is
  blank) → an info strip of up to 2 cards, **Best For** and **Booking
  Advice** (deliberately not the competitor's "Departure Airports" card,
  which is UK-specific) → the shared package grid. 404s when the month
  isn't `is_active` — same query gate the sitemap and the nav dropdown
  both use, so an inactive month can't be reached or discovered from
  anywhere on the site.
- **Shared grid extraction**: the package-grid block on `/umrah` was
  pulled out into `components/site/PackageGrid.tsx` (pure extraction, no
  behavior change) so the departure page renders the identical
  Essential/Signature/Privé cards via the same component — verified `/umrah`
  still renders identically after the extraction. `/hajj` was left
  untouched and still has its own inline copy of this same grid pattern,
  per "don't touch Hajj."
- **Header nav**: `(site)/layout.tsx` now server-fetches active months
  and passes them to `Header`, which builds the "Umrah" dropdown from
  them (sorted by `sort_order`) instead of a static list — done
  server-side so the dropdown is present on first paint, not a
  client-side fetch flash. Zero active months means no `children` on the
  Umrah nav item at all, so it falls back to Header's normal plain-link
  behavior exactly like every other item without a dropdown — verified
  live (pre-migration, so genuinely zero months resolve) that "Umrah"
  renders with no dropdown, not an empty one.
- **Admin** (`/admin/umrah-departures`): list + edit screens following
  the same conventions as the Packages admin (table with inline
  Activate/Deactivate and Delete, a separate edit page per row). Slug is
  a plain, fully admin-controlled text field — there's no
  auto-slugify/date logic to keep in sync with "no hardcoded year."
- **Sitemap**: `app/sitemap.ts` is new (none existed before) — kept
  deliberately minimal, listing only the known static top-level routes
  plus active departure months, rather than growing this pass into a
  full site-wide sitemap covering hotels/packages/transfers/visa detail
  pages (out of scope here; easy to extend later). Verified live that
  `/sitemap.xml` returns 200 with the static routes and simply omits
  departure months while the table doesn't exist yet — confirms the
  same graceful-degrade behavior as an active-months query with no rows.

**Migration 0016 has not been applied to the live database yet** — same
constraint as 0013/0014/0015. Verified live against the current
(pre-migration) database: `/umrah` renders unchanged, `/hajj` is
unaffected, `/umrah/departures/january` 404s cleanly (not a crash) with
the expected "table not found" error logged server-side, the header
shows no Umrah dropdown, `/sitemap.xml` returns 200, and
`/admin/umrah-departures` redirects to login like every other admin
route. Typecheck and lint both pass clean.

## Richer package listing cards (real pricing, no new column)

`/umrah` and `/hajj` cards now match a reference layout's information
density — the same dual-CTA WhatsApp pattern throughout, no
Reserve/booking button added anywhere.

- **"Starting from" is computed at query time, not stored.** No new
  column was added — `lib/data/public.ts#getPackageRoomPricesByPackageIds()`
  does one batched `package_room_prices` query (active rows only) for a
  whole grid of packages, and `PackageCard` takes `Math.min()` of
  whatever room prices it's handed. This intentionally does NOT trust
  the existing cached `packages.starting_price_aed` column (kept in sync
  by the admin form on save, per the earlier duration-variants chunk) —
  computing fresh means the headline price can never drift from the
  room-pricing list right below it on the same card, even if that cache
  were ever stale.
- **`PackageGrid`** (`components/site/PackageGrid.tsx`) now groups its
  packages into labeled Essential/Signature/Privé sections (mirroring
  the tier-grouping already built for the admin Packages list), each
  fetching its own room prices and rendering its duration variants as
  sibling cards. A tier with zero active duration variants is skipped
  entirely — no empty heading. Because `/umrah`, `/hajj`, and every Umrah
  departure month page all render through this one component, all three
  picked up the richer cards automatically — `/hajj` was migrated from
  its own inline card grid to `PackageGrid` as part of this same change
  (explicitly asked for this time, unlike the departure-months chunk
  which deliberately left Hajj alone).
- **`PackageCard`** gained an inclusions bullet list (first 2-3 lines of
  `inclusions_text`, same field already used on the detail page) — shown
  whenever that text exists, regardless of caller, so the homepage's
  featured-packages section picked it up too. The room-pricing list
  itself needed no changes; it already existed behind an optional
  `roomPrices` prop and already rendered through `<Price>` — just wasn't
  being populated on the listing pages before.
- **Currency-aware for free.** Both the per-room prices and the "From"
  headline go through the existing `<Price amountAed={...} />`, so the
  currency switcher converts them exactly like it already does for
  hotel/room prices — verified live by switching to USD on `/hajj` and
  confirming every price on every card converted correctly (e.g. AED
  12,950 → $3,526).
- **Admin Packages list** (`/admin/packages`): the "Starting From (AED)"
  column now runs through the same
  `getPackageRoomPricesByPackageIds()` helper instead of reading the
  cached column, for the same query-time-not-stored reason.
- **Homepage consistency fix (found while verifying, not originally
  asked):** the homepage's "Featured Umrah Packages" section uses
  `PackageCard` directly (not `PackageGrid`, since it deliberately shows
  a flat few featured picks rather than grouping by tier) and was
  relying on the old cached `starting_price_aed` column, which turned
  out to be unpopulated for the live placeholder packages — so it was
  silently showing no price at all. Wired the same
  `getPackageRoomPricesByPackageIds()` call into the homepage too so it
  shows real prices and matches `/umrah`/`/hajj` rather than looking
  broken by comparison.
- Nothing in `package_room_prices`, duration variants, or the admin
  duration-variant form (`PackageForm.tsx`, `actions.ts`'s tier-copy
  sync) was touched — this is read-only on top of that existing data.

Verified live against the current database: `/umrah` and `/hajj` both
render tier sections with real per-room pricing and computed "From"
prices matching the seeded room-price data exactly, the currency switch
converts every price on the cards, and the admin Packages list compiles
and redirects to login like every other admin route (same as always — no
login credentials available in this pass). Typecheck and lint both pass
clean.

### Follow-up: grid dead-space fix + itinerary section

Two fixes on top of the above, both scoped to layout/rendering only — no
pricing, currency, departure-months, or admin-form changes.

- **Fixed a `PackageGrid` layout bug**: a tier's card grid used a fixed
  `lg:grid-cols-3`, which reserves 3 equal-width tracks regardless of
  item count — with 1 duration variant, that left 2 empty tracks as
  visible dead space to the right of the card. `PackageGrid.tsx` now
  branches: a single duration variant renders in its own `max-w-sm`
  wrapper (no grid at all, so there's nothing to reserve), while 2+
  variants use the exact same `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`
  classes as the Hotels listing grid (`HotelsBrowser.tsx`), for pixel-
  identical breakpoint behavior between the two. Verified via computed
  layout (`getBoundingClientRect`/`getComputedStyle`, not just visual
  inspection) at 375px (mobile — 1 column, 343px cards, no horizontal
  overflow), 1024px (2 columns), and 1280px (3 columns, 384px cards) —
  simulating extra duration variants by cloning a card node client-side
  for the multi-card branch, since the live (pre-migration) database
  only has one duration per tier to test against right now.
- **Added an Itinerary section** to `PackageDetail.tsx` (shared by
  `/umrah/[slug]` and `/hajj/[slug]`), between the inclusions/overview
  box and Room Pricing — a `Day N` heading plus that day's line(s) per
  entry, reading the same `packages.itinerary` jsonb column the admin
  form's "Itinerary" field already saves into
  (`PackageForm.tsx`/`actions.ts#parseItinerary` — untouched, already
  round-trips correctly). Renders nothing at all when `itinerary` is
  empty (`pkg.itinerary.length > 0` guard) rather than an empty
  heading; renders normally when it holds the current placeholder text
  ("Placeholder itinerary — pending real package details from Haseeb")
  since that's real (if provisional) content, not a missing-data case.
  Verified live on both an Umrah and a Hajj detail page.

## Umrah/Hajj package enquiry popup

Replaces the plain "WhatsApp" button on Umrah/Hajj package cards
(`PackageCard.tsx`) and the sidebar CTA on their detail pages
(`PackageDetail.tsx`) with an "Enquire on WhatsApp" button that opens a
popup enquiry builder first — package context plus optional
flight/visa/hotel/transfer add-on toggles, then one combined pre-filled
WhatsApp message. Hotels, Transfers, and Visa keep their existing plain
`WhatsAppButton` untouched, as do the package detail page's per-room
"Enquire about this room option" buttons (a different, narrower flow,
same reasoning as leaving the hotel-specific WhatsApp buttons alone).

**Pre-flight inventory (done before writing any code, per the request):**
`package_upgrades`/`package_upgrade_room_prices` (the "Plus" upgrade
fields in `PackageForm.tsx`) and `package_transfer_addons` (its
"Transfer Add-on" section) both exist and are fully wired in
`actions.ts#savePackage`, but **both have zero rows in the live
database** — never used. They model something different anyway
(admin-configured, persistent, priced package add-ons), not a visitor's
ephemeral per-enquiry checkboxes, so nothing was reused/extended there —
this feature doesn't touch either table or that part of the admin form.
Also re-checked rather than assumed: **the WhatsApp Templates DB
migration (0013/0014) turned out to already be live** (12 rows in
`whatsapp_templates`, matching 0015's duration variants and 0016's
departure months also being live) — so this was built against the
DB-backed template system, not the old hardcoded constants.

- **New template key `packageEnquiry`** (`0017_seed_package_enquiry_template.sql`,
  and inserted live via the service-role key so the feature actually
  works right now rather than waiting on a migration apply) holds only
  the fixed opening line — `"Assalamu Alaikum, I'd like to enquire about
  {{packageTitle}} ({{tier}} — {{duration}})."` — editable from Admin →
  WhatsApp Templates like every other key. The add-on lines and the
  month line are appended client-side (`PackageEnquiryButton.tsx`)
  rather than templated, since `interpolate()`'s flat `{{token}}`
  replacement can't express "only show this line if selected" — only
  toggled-on add-ons produce a line; nothing says e.g. "Flight: No".
- **`PackageEnquiryButton.tsx`** (new, client component) renders the
  trigger button and the modal together. The modal shows read-only
  package name/tier/duration, four toggles (Flight → date input,
  Visa → one-line note, Hotel preference → one-line note, Transfers →
  toggle only), and "Send on WhatsApp", which builds the full message
  and calls `buildWhatsAppLink()` — the exact same link-building
  mechanism every other WhatsApp button already uses. Fully client-side:
  no database writes, no enquiry-tracking table. Mobile-friendly as a
  bottom sheet (`items-end` + rounded top corners below `sm:`,
  centered dialog above it).
- **Departure-month context, propagated end to end, never guessed:**
  `PackageGrid` accepts optional `departureMonthSlug`/`departureMonthLabel`
  props, set only by `/umrah/departures/[slug]/page.tsx`. `PackageCard`
  forwards `departureMonthLabel` straight into its own popup, and
  appends `?month={slug}` onto its "View Details" link so the *detail*
  page's popup can mention the same month too — `PackageDetail` reads
  that query param (added to both `/umrah/[slug]` and the shared
  component; not added to `/hajj/[slug]`, since Hajj has no departure
  months) and looks up the month's `display_label`. On the plain
  `/umrah`/`/hajj` listings, or a detail page reached without that
  param, the month line is simply absent.
- **Verified live, end to end**, including the cross-page propagation:
  temporarily activated the seeded "October" departure month via the
  service-role key (toggling only `is_active`, nothing else, then
  restored it to `false` afterward), confirmed its card's "View Details"
  link carried `?month=october`, opened that URL directly, and captured
  the actual constructed message by intercepting `window.open` in the
  browser — confirmed both the card's and the detail page's popups
  produce exactly the right text, e.g.: `"...Interested month: October
  26\nHotel preference: ground floor room if possible"` with no
  extraneous lines for untoggled add-ons. Also confirmed on the plain
  `/umrah` listing that the message correctly omits the month line, and
  that Hotels/Transfers/Visa buttons and the package detail page's
  per-room buttons are all byte-for-byte unchanged (`<a href="wa.me/...">`
  links, not the new popup).
- Removed `packageGeneralTemplateKey()` from `lib/whatsapp-templates.ts`
  as dead code once its only two call sites were replaced (confirmed via
  grep, zero remaining references) — the `umrahEssential`/
  `umrahSignature`/`umrahPrive` keys, their defaults, and their DB rows
  were deliberately left in place rather than deleted (same treatment as
  the already-dormant `upgradeToPlus`), since removing admin-editable
  content wasn't asked for and Haseeb may still want that wording for a
  future use.
- No booking/payment UI, no changes to pricing/currency/itinerary/layout
  from the previous chunks, and `package_upgrades`/`package_transfer_addons`
  remain completely untouched (still zero rows).

## Package card redesign (full-width horizontal, tier short description)

Replaced the earlier grid-based card layout — which needed a special
case for a tier with only one duration variant to avoid a dead-space gap
next to it — with a horizontal, always-full-width card, stacked
vertically within its tier section. A full-width card has no "how many
columns" question to get wrong, so the single-vs-multiple-variant
special case in `PackageGrid.tsx` is gone entirely; both cases now use
the exact same `space-y-4` vertical stack.

- **`PackageCard.tsx`**: `flex-col` (image on top, stacked) below `sm:`,
  `sm:flex-row` (image left, ~256-320px wide, full row height via flex
  stretch) at `sm:` and up — the card's own JSX didn't need any
  width/max-width class at all, since a plain `flex-1` block always
  fills its parent now. Kept every existing data element (title,
  duration, inclusions, room-pricing list, "From AED X", dual CTA) — only
  the container's flex direction and some internal spacing changed, plus
  two small layout tweaks to use the extra width sensibly instead of
  leaving it visually sparse: inclusions bullets flow into 2 columns at
  `sm:`, and the room-pricing rows became a `flex-wrap` row of compact
  pills instead of a stacked list. Price and the two CTA buttons now
  share one row at `sm:` (price left, buttons right) instead of a
  buttons-only row below a separate price row.
- **New tier-level field `short_description`** (`packages` table,
  `0018_package_short_description.sql`, nullable, no backfill — no real
  copy exists for the 6 placeholder packages and inventing marketing
  text isn't this project's call, same "no invented content" rule as
  itineraries/testimonials). Synced across duration-variant siblings the
  same way as `title`/`inclusions_text`/`city_destination` — added to
  both the payload and the sibling-sync update in
  `actions.ts#savePackage`. `PackageGrid.tsx` renders it once per tier,
  under the tier heading and above that tier's card(s), reading
  `items[0].short_description` (any sibling has the synced value) —
  is rendered on each package card alongside the separate admin-editable
  `tagline`, so the line is never blank/broken or omitted. Added to
  `PackageForm.tsx`'s "1. Basic Information"
  section as a 2-row textarea; needed an optional `className` prop added
  to the shared `Field` component (`components/admin/ui.tsx`) to span
  both grid columns — additive, doesn't affect any of Field's other
  existing call sites.
- **Verified live** at both viewport widths, on `/umrah`, `/hajj`, and
  `/umrah/departures/october` (temporarily activated via the
  service-role key, only flipping `is_active`, then restored to
  `false`): computed layout geometry (not just visual inspection) shows
  the card spanning the full container width with `flex-direction: row`
  at desktop (1024px) and `column` at mobile (375px), zero horizontal
  overflow (`document.documentElement.scrollWidth` never exceeds
  `window.innerWidth`) on any of the three page types. Also simulated 3
  duration variants in one tier (cloning a card client-side, since the
  live database still has only one variant per tier) and confirmed they
  stack vertically at full width with no side-by-side dead space, the
  original bug this chunk fixes.

**Migration 0018 has since been applied** (confirmed live via direct
schema query — see the migration-audit note at the end of this file for
the general "how do we know for sure" methodology). At the time this
section was written it wasn't; code was written to degrade gracefully
either way, which is what let this be verified before the migration
landed. Typecheck and lint both pass clean.

## Hajj-only fields: maktab category + segmented itinerary

Two fields on `packages` that only ever apply when `type = 'hajj'` —
always `null`/empty for Umrah, whose existing fields (including the
day-by-day `itinerary` column) are completely untouched.

- **`maktab_category`** (`0019_hajj_maktab_itinerary_segments.sql`,
  free text, not an enum — Haseeb may phrase it differently per package)
  is tier-level, synced across duration-variant siblings exactly like
  `title`/`short_description` (added to both the payload and the
  sibling-sync update in `actions.ts#savePackage`). Shown in
  `PackageForm.tsx`'s "1. Basic Information" section, but only when
  `type === "hajj"` — the Package Type radio became a controlled input
  (`useState`) specifically so this field (and the itinerary section
  below) can show/hide live as the admin switches type, not just reflect
  whatever type the package loaded with.
- **`itinerary_segments`** (jsonb array of `{location, nights,
  board_type, note}`) replaces the flat day-by-day `itinerary` field for
  Hajj specifically. Per-duration, deliberately **not** synced — same
  reasoning as the existing `itinerary` column already had (flagged in
  an earlier chunk): a 10-night and a 17-night Hajj package genuinely
  need different segments, so syncing would be wrong here even though it's
  right for `maktab_category`. `PackageForm.tsx`'s Hajj branch replaces
  the plain itinerary textarea with a repeatable segment list (add/remove
  rows, same interaction pattern as the existing Room Pricing list);
  Umrah packages keep the exact same plain textarea as before.
- **`PackageDetail.tsx`**: the metadata line under the title (city +
  duration) gains a third item — `{maktab_category} Maktab` — only when
  `type === "hajj"` and the field is set. The itinerary section now
  branches on `type`: Hajj renders `itinerary_segments` as a bulleted
  list (location bold, then "— N Nights · Board Type", then the note on
  its own line if present); Umrah renders the exact same day-by-day
  block as before, byte-for-byte unchanged.
- **Defensive `?? []` on `itinerary_segments`** in `PackageDetail.tsx`
  — needed because, at the time this was written, migration 0019 wasn't
  live yet: `pkg.itinerary_segments` would be `undefined` (a missing
  column, not an error) rather than `[]`, and `undefined.length` throws.
  Caught this by reasoning through the pre-migration state rather than
  by it actually crashing in front of me — worth calling out since the
  same class of bug could recur for any new array/jsonb column added to
  `packages` before its migration is applied.

**Verified live**: `/umrah/umrah-essential-placeholder` renders
byte-for-byte identical to before this chunk (no maktab line, day-by-day
"Day 1" itinerary intact, zero console errors) — confirms Umrah is
genuinely unaffected, not just "should be" by code inspection.
**Update: migration 0019 has since been applied**, and full end-to-end
verification is done. Simulated an admin save via the service-role key
(the exact writes `savePackage()` makes — full payload on the edited
row, then the same sibling-sync `UPDATE` for `maktab_category` only) on
Essential Hajj, plus a temporary second duration variant under the same
tier to test sibling behavior specifically. Confirmed: `maktab_category`
synced correctly to the sibling (tier-level, as designed);
`itinerary_segments` did **not** — the sibling's detail page correctly
showed no Itinerary section at all, confirming it's genuinely
per-duration, not accidentally inherited. `/umrah/umrah-essential-placeholder`
re-checked post-migration and still byte-for-byte matches its
pre-migration capture. All temporary data (the extra duration variant,
the test `maktab_category`/`itinerary_segments` values) was deleted/reset
afterward — nothing left behind.

## Hajj-specific card style + duration-first grouping

`/hajj` now has its own distinct compact card and its own grouping
logic — deliberately separate components from Umrah's, not a shared one
parameterized two ways. Umrah's `PackageGrid.tsx`/`PackageCard.tsx` were
not touched at all in this chunk.

- **`HajjPackageCard.tsx`** (new): image-top, tier badge, title, up to 3
  inclusions bullets, a compact room-price mini-table, "From AED X", and
  a single CTA — the same `PackageEnquiryButton` (labeled "Enquire on
  WhatsApp") every other package CTA already uses, not a new button or
  wording. No second "View Details" button — the image and title are
  themselves links to the detail page, so the card stays navigable
  without a second, redundant CTA competing with the single deliberate
  one.
- **`HajjPackageGrid.tsx`** (new): groups by `duration_days` first
  ("14 Day Hajj Packages", etc.) rather than by tier — the inverse of
  `PackageGrid`'s tier-first grouping — then shows that duration's
  Essential/Signature/Privé cards in a standard `sm:grid-cols-2
  lg:grid-cols-3` grid (not the full-width-horizontal treatment Umrah
  cards use, so the earlier "dead space beside a lone card" fix doesn't
  apply here the same way — `HajjPackageCard` is compact by design and
  sits fine alone in a grid cell, the same way a single Hotel card does
  on `/hotels`). A duration section is simply omitted if no tier has an
  active package at that length — didn't need to special-case this:
  the grouping is built by finding one package per (duration, tier) pair
  and filtering out empty groups, so an all-empty duration just produces
  no section at all, same graceful-degrade shape as everywhere else in
  this codebase.
- Why a separate component rather than a "groupBy" prop on the existing
  `PackageGrid`: tier-first-then-duration and duration-first-then-tier
  aren't the same shape with a flag flipped — one groups by a fixed
  3-value enum with a label lookup and shows `short_description` per
  group, the other groups by an open-ended numeric value computed from
  the data itself with no per-group description field. Forcing both into
  one component would mean branching most of its internals; a second,
  smaller component was the safer change and guarantees Umrah's behavior
  can't regress from a shared-code edit made for Hajj's sake.

**Verified live**: `/hajj` now shows "14 Day Hajj Packages" (Essential +
Signature Hajj side by side — both currently 14 days) and "16 Day Hajj
Packages" (Privé Hajj alone) as two separate sections — matches the live
data exactly, and no empty sections render for durations nothing
currently occupies. Confirmed exactly one "Enquire on WhatsApp" button
per card (queried the DOM directly for `button` elements, not just a
visual glance) and that each card's title/image link to the correct
`/hajj/[slug]` detail page. `/umrah` re-confirmed via `get_page_text`
producing the exact same content, order, and structure as its
pre-chunk capture — pixel-level geometry re-verification wasn't
possible this pass because the Browser pane was hidden on the user's
end (`innerWidth`/`innerHeight` report `0`, a known limitation, not a
site bug), but zero code in `PackageGrid.tsx`/`PackageCard.tsx` changed
in this chunk, and the content-level match is exact.

## Bug investigation: hajj-exclusive-placeholder's inconsistent duration

**Root cause, confirmed by reading `savePackage()` directly, not
guessed:** there was no save-path bug. `duration_days` is always
computed as `duration_nights + 1` from the same form field and both are
written together on every save, insert or update — no code path updates
one without the other. The row's actual `duration_nights`/`duration_days`
pair (15/16) was already internally consistent with that formula.

The real issue: `PackageForm.tsx` has exactly one numeric duration input
("Duration (Nights)") plus a separate, purely-decorative free-text
"Duration Label" field — by original design (per 0012's own migration
comment), intentionally independent of the numeric fields. The row's
`duration_label` read `"15 Nights / 14 Days"` — self-contradictory text
that doesn't match either the stored pair or a consistent nights+1
relationship. The admin, wanting this package at 14 days, had typed that
text into the label field instead of changing the Duration (Nights)
number (left at 15) — and `HajjPackageGrid` groups strictly by the
numeric `duration_days` column, never reading `duration_label`, so
nothing about the grouping ever moved. Not a computation bug; an admin
edit landing on the wrong (decorative) field, one whose design made that
easy to do.

**Fix**: reworded the Duration Label field's hint in `PackageForm.tsx`
to say explicitly that it's display-only and doesn't affect grouping —
a small, directly-scoped change addressing the actual root cause (operator
confusion) rather than "fixing" a computation that was already correct.
Left the field's independence from the numeric values intact — that's
deliberate prior design (an admin may legitimately want different
wording), not something this bug calls for removing.

**Data correction** (DML only — `duration_nights`/`duration_days` are
plain integer columns, no DDL needed): `hajj-exclusive-placeholder` set
to `duration_nights=13`, `duration_days=14`,
`duration_label="13 Nights / 14 Days"` — matching its Essential/Signature
14-day siblings exactly. Confirmed via a fresh query that all 11 other
Hajj rows kept their original `updated_at` timestamps — nothing else
was touched.

**Verified live**: `/hajj` now shows Exclusive under "14 Day Hajj
Packages" alongside Essential and Signature, and the "16 Day Hajj
Packages" section has disappeared entirely (it had no other occupant).
The detail page's title/duration/label are now fully consistent
("13 Nights / 14 Days" everywhere), and pricing/itinerary/maktab
category — all unrelated to this bug — are unaffected, as expected.

**Flagged, not fixed (out of this task's explicit scope):** the row's
`itinerary_segments` still sum to 15 nights (4+3+5+3), not the corrected
13 — a residual inconsistency from the same original data-entry issue,
on a different field this task didn't ask me to touch. Worth a small
follow-up whenever convenient.

## Tier rename: "Privé" → "Exclusive" (Umrah and Hajj)

A real enum-value rename, not a display-label patch — `package_tier` is
a native Postgres enum (`'essential' | 'signature' | 'prive'`), so the
canonical fix is `alter type ... rename value`
(`0021_rename_prive_to_exclusive.sql`), which Next.js can't run
(DDL — same constraint as every schema change this project has needed).
Renaming an enum VALUE is metadata-only in Postgres: every row already
tagged `'prive'` repoints to `'exclusive'` the instant this runs — no
per-row `UPDATE`, no data loss risk, nothing to migrate on the rows
themselves.

**What could be done via DML (slugs, titles, template text) was done
immediately, ahead of the DDL:**
- 5 package rows renamed — full before → after list:
  - `umrah-prive-placeholder` → `umrah-exclusive-placeholder` (title
    "Privé Umrah" → "Exclusive Umrah")
  - `hajj-prive-placeholder` → `hajj-exclusive-placeholder`
  - `hajj-prive-10-days` → `hajj-exclusive-10-days`
  - `hajj-prive-17-days` → `hajj-exclusive-17-days`
  - `hajj-prive-25-days` → `hajj-exclusive-25-days`
  - (Hajj titles: "Privé Hajj" → "Exclusive Hajj")
  Found via a full-field scan across every column of every `packages`
  row (not just the ones expected to match) — confirmed only `tier`,
  `title`, `slug` ever contained "Privé"/"Prive"; nothing in
  `inclusions_text`, `maktab_category`, `itinerary_segments`, or any
  other field needed touching.
- `whatsapp_templates` key `umrahPrive` → `umrahExclusive`, its label
  "Umrah — Privé Package" → "Umrah — Exclusive Package", and its
  `template_text` updated to say "Exclusive Umrah experience". Checked
  every other row's `key`/`label`/`template_text` (including
  `packageEnquiry` specifically, as asked) for any other "Privé"
  reference — found none; `packageEnquiry` was already clean since it
  interpolates a `{{tier}}` placeholder rather than hardcoding any tier
  name.

**Code rename — every file grepped, every match changed, re-grepped to
confirm zero remaining:** `PackageTier` type, both `TIER_LABEL` maps and
both `TIER_ORDER` arrays (`PackageGrid.tsx`, `HajjPackageGrid.tsx`,
`PackageCard.tsx`, `HajjPackageCard.tsx`, `PackageDetail.tsx`, admin
`page.tsx`'s `TIER_TONE`/`TIER_LABEL`/`TIER_ORDER`), the admin form's
tier `<option>`, plus incidental plain-text/comment mentions in
`/umrah`'s intro copy and two doc comments. `src/` is now 100% clear of
"Privé"/"Prive" (verified by re-grepping the whole directory after
every edit, not just the files touched). The "MOST CHOSEN" badge
(Signature) was untouched, as instructed — it was never tier-name text
to begin with.

**Intentionally NOT edited — historical record, not live state:** past
migration files (`0001`, `0011`, `0012`, `0014`, `0015`, `0016`, `0020`)
and the README's own earlier dated sections still say "Privé" in places,
describing what was literally true when those chunks were written.
Rewriting migration history would misrepresent what actually ran;
rewriting old README narrative would misrepresent what was verified at
the time. Both are called out here rather than silently left, per the
"report what you find" instruction — this rename's own new migration
file necessarily also contains the word "Privé" in its own explanatory
comments, describing the very thing it renames.

**Verified live, precisely, including the current (expected) breakage
this migration hasn't been applied yet:**
- Old slug (`/hajj/hajj-prive-placeholder`) 404s cleanly — confirmed via
  console (clean 404, not an unhandled error) and page title falling
  back to the generic not-found page.
- New slug (`/hajj/hajj-exclusive-placeholder`) loads successfully,
  title "Exclusive Hajj" — and **everything that doesn't depend on the
  enum carried over correctly**: room pricing ($6,794/$7,475/$8,700,
  converting live to USD — currency conversion unaffected), the full
  itinerary segment breakdown (Madinah/Aziziyah/Mina & Arafat/Aziziyah),
  and `maktab_category` ("VIP A-Category Maktab"). The **one** thing
  currently broken is the tier badge text itself — the breadcrumb reads
  "HAJJ / " with a blank instead of "HAJJ / EXCLUSIVE" — because
  `TIER_LABEL[pkg.tier]` no longer has a `'prive'` key and the live row
  is still tagged `'prive'` at the DB level. No crash; React just
  renders the missing lookup as nothing. This is the exact, isolated,
  predicted symptom of the DDL not being applied yet — not a surprise,
  not a sign of data loss.
- `/umrah` and `/hajj` listing pages: the "Exclusive" tier section is
  currently **entirely absent** from both (0 rows match
  `tier === "exclusive"` today) — every other section (Essential,
  Signature, and on `/hajj` every duration heading) is unaffected.
  Confirmed this is the whole and only symptom by checking the DOM
  heading list directly, not by eyeballing a screenshot.
- Admin routes still compile and redirect to login normally (no login
  credentials available to verify the admin list's rendering directly).

**This migration needs to be applied promptly — more urgently than the
prior additive ones.** Every previous migration in this project degraded
gracefully when pending (a missing column just reads as `undefined`,
nothing crashes, nothing visibly regresses). This one is different: it's
a genuine, currently-live regression — the Exclusive/Privé tier has
disappeared from both public listing pages, and its two detail pages
that still work show a broken tier badge — until
`0021_rename_prive_to_exclusive.sql` is applied. Once it is, no further
action is needed on my end; the rename is already complete everywhere
else.

## Hajj placeholder data: pricing, itinerary segments, maktab category

Data-only chunk — no code changed. Filled in rough/placeholder content
for all 12 live Hajj rows (the 3 original + the 9 seeded last chunk) so
every active card actually shows pricing and an itinerary, per the
client's explicit "rough content they'll correct later" framing.

- **Room pricing** for the 9 rows that had none: scaled from each
  tier's real existing price (fetched fresh, not assumed —
  Essential/Signature from their 13-night row, Privé from its 15-night
  row) proportionally to `duration_nights`, rounded to the nearest AED
  50. The 3 already-priced rows were left alone — the script checked for
  existing `package_room_prices` rows per package and skipped
  re-inserting where prices already existed, so nothing was duplicated
  or overwritten there.
- **`itinerary_segments`** populated on **all 12** rows (the 3 existing
  ones included, as asked, not just the 9 new ones): Mina & Arafat held
  at a fixed 5 nights (roughly matching the real ritual-day duration,
  regardless of package length — that's the actually-realistic part of
  a Hajj itinerary, the length differences are mostly extra Madinah/
  Aziziyah nights before and after), remaining nights split ~40/30/30
  across Madinah → Aziziyah (pre) → Aziziyah (post). Every row's
  segments sum exactly to its own `duration_nights` (verified
  programmatically, not eyeballed). Directionally sensible, not
  precisely engineered, per the instruction.
- **`maktab_category`**: "A-Category" for Essential/Signature, "VIP
  A-Category" for Privé, written identically across all duration
  siblings of each tier (simulating the sync behavior directly, the
  same way earlier tier-level-field seeding did) — Essential's 10/14/17/
  25-day rows all carry the exact same value.
- **Caught and fixed before reporting done**: my first pass used
  `"A-Category Maktab"` as the stored value, which duplicated with
  `PackageDetail.tsx`'s existing `{maktab_category} Maktab` rendering
  (from the chunk that built that field) — the live page read "A-Category
  Maktab Maktab". Caught this by actually reading the rendered page
  rather than trusting the write, corrected the 12 rows to the bare
  `"A-Category"`/`"VIP A-Category"` the field's original spec called
  for, and reconfirmed. The itinerary segment *note* text
  ("A-Category Maktab tents") was correctly left alone — that's
  free text with nothing else appended to it, so no collision there.
- **`is_active`/`show_on_website` — read, never written.** All 12 rows
  were already `is_active: true` / `show_on_website: true` before this
  chunk (unchanged from the "someone's been in the admin screen" state
  noted at the end of the previous chunk) and are still exactly that
  after — the before/after query results are identical, confirming
  nothing here touched those columns even incidentally.

**Verified live**: `/hajj` now shows all 5 duration sections (10/14/16/
17/25 Day) with real-looking, sensibly-scaled pricing on every one of
the 12 cards. Checked two Essential-tier detail pages at different
durations (10-day and 14-day) side by side: `maktab_category` reads
identically ("A-Category Maktab") on both — sync confirmed — while their
`itinerary_segments` are genuinely different (2/1/5/1 vs 3/2/5/3 nights)
— confirmed not synced, per-duration as designed. Also checked Privé
("VIP A-Category Maktab", no duplication). `/umrah` reconfirmed
unaffected (zero code changed this chunk). No stray temp files left in
the project directory.

## Enquiry popup: 6th toggle (extra nights) + calmer framing copy

`PackageEnquiryButton.tsx` — the shared popup both Umrah and Hajj cards
use — got two small, deliberately separate changes: one functional, one
copy-only.

- **New toggle: "I'd like extra nights / an extended stay"** — same
  pattern as the other five (checkbox reveals a one-line free-text
  field, message line only appears if toggled on). Line format:
  `Extra nights / extended stay: <note or "yes">`, matching the existing
  Hotel-preference/Price-match line style exactly.
- **Copy pass, framing text only — not the toggles themselves:**
  replaced the small-caps instructional line "Add anything else you'd
  like us to know (optional)" with a full sentence that explicitly says
  there's no obligation: "Happy to help with anything else — everything
  below is optional, and there's no obligation." The button label
  ("Enquire on WhatsApp"), the six toggle labels, and "Send on
  WhatsApp" were all left exactly as they were — none of them read as
  pushy/sales-flavored to begin with, and the toggle wording itself was
  explicitly out of scope for this pass.
- **Template check, not a change:** confirmed `packageEnquiry`'s DB
  default text still reads naturally with 6 possible add-on lines
  instead of 5 — same reasoning as when Price Match was added: every
  add-on line is appended client-side after the fixed opening line, not
  templated via `{{}}` placeholders, so the count of possible lines
  never affects how the template's own text reads. No template edit
  needed or made.

**Verified live**, capturing the actual constructed message via a
`window.open` intercept rather than assuming from the code:
- Umrah (Essential Umrah card): toggled Flight + Extra Nights together →
  `"...Flight needed: yes (preferred date: 2026-11-05)\nExtra nights /
  extended stay: 2 extra nights in Madinah"` — correct line order,
  Visa/Hotel/Transfers/Price-match correctly absent since untoggled.
- Hajj (Essential Hajj, 10-day): toggled Visa + Extra Nights →
  `"...Visa needed: yes — need help with visa steps\nExtra nights /
  extended stay: not sure, want to discuss"` — confirms the popup works
  identically on a Hajj card, not just Umrah.
- Hotels/Transfers/Visa: confirmed zero regressions — Hotels still
  shows 13 plain `wa.me` links (not popup buttons), Transfers 13,
  Visa 1, all direct `<a href="wa.me/...">`.
- Softened intro copy confirmed rendering correctly alongside all 6
  toggle labels in the DOM.

**Aside, unrelated to this chunk:** while verifying on `/hajj`, found
that all 9 placeholder duration rows seeded last chunk are now
`is_active = true` (they were left `false`) — someone's been using the
admin screen since. Not touched or reverted; that's your own data,
not a regression from this change, and reverting it without being
asked would be overstepping.

## 9 placeholder Hajj duration rows (10/17/25-day, all 3 tiers)

Seeded via `0020_seed_hajj_duration_placeholders.sql` — applied live
immediately (pure `INSERT` into an already-existing table, no DDL
needed). Gives the admin slots matching the reference layout's other
durations (9/16/24 nights = 10/17/25 days) across Essential, Signature
and Privé — 9 new rows, all `is_active = false` / `show_on_website =
false`.

- **Tier-level copy** (`title`, `city_destination`, `inclusions_text`,
  `advance_booking_note`, `flight_note`, `rate_disclaimer`,
  `validity_label`, `is_featured`) was copied verbatim per tier from
  that tier's existing live row (fetched directly rather than
  reconstructed from memory) — not new invented marketing copy, just
  extending the same already-established 0012 placeholder text to the
  new duration siblings, which keeps the tier-level sync invariant
  intact (every duration variant of a tier is supposed to carry
  identical tier-level copy). `short_description` stays `null` on every
  Hajj row already, so the new ones match without needing to touch it.
- **`maktab_category`/`itinerary_segments`** left `null`/`[]` per
  instruction — genuinely empty, not placeholder text, since there's
  nothing sensible to place there yet.
- **Slugs** follow the exact pattern given —
  `hajj-{tier}-{days}-days` (e.g. `hajj-essential-10-days`) — a
  different shape from the newer `buildDurationSlug()` convention
  (`{type}-{tier}-{nights}-nights`) the admin's "+Add Duration" flow
  auto-generates; used the literal pattern specified rather than the
  newer convention.

**Verified live, including the part that can't be seen just by looking
at today's `/hajj`:** confirmed the 3 existing rows are genuinely
untouched (`updated_at` unchanged, still `is_active = true`) and the
public `/hajj` page is byte-identical to before seeding — still only
"14 Day"/"16 Day Hajj Packages", the 9 new rows correctly invisible
while inactive (this is `is_active` doing exactly what it's designed to
do, not a bug — inactive packages don't appear on the public site
anywhere in this codebase, full stop). Simulated the admin packages
list's exact query and grouping logic (not the real admin UI — no login
credentials available) and confirmed all 4 duration variants per tier
group and sort correctly by nights. Then, to directly prove the new
sections render correctly rather than assert it from code alone,
**temporarily activated all 9 rows**, confirmed `/hajj` correctly showed
five sections in ascending order — 10/14/16/17/25 Day — with the three
new ones showing correct tier badges, titles, inclusions, and CTA, and
gracefully omitting the room-price table and "From" price (no room
prices exist for these rows yet, handled exactly like any other
package with no pricing entered) — then **restored all 9 back to
`is_active = false`** and reconfirmed `/hajj` returned to exactly its
original two sections.

## Package room prices — inventory for a possible future "category" field

Asked to report only, not build. Current schema
(`supabase/migrations/0001_init.sql`, unchanged since — confirmed by
grepping every migration for `package_room_prices`, not assumed from
memory):

```sql
create table public.package_room_prices (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  room_type text not null, -- e.g. "Quad", "Triple", "Double"
  price_aed numeric(10, 2) not null check (price_aed >= 0),
  is_active boolean not null default true,
  display_order integer not null default 0
);
create index package_room_prices_package_id_idx on public.package_room_prices (package_id);
```

No unique constraint on `(package_id, room_type)` — nothing at the DB
level currently stops two rows with the same `room_type` for one
package. RLS: public read gated on `is_active` + the parent package
being publicly visible; admin has full access.

**Adding a category field (e.g. "sharing"/"separate") is a small,
additive change, not a restructuring.** Reasoning:
- No unique constraint or enum currently constrains `room_type` that a
  new column could conflict with — `alter table ... add column category
  text` (nullable, or `not null default 'sharing'` if every existing row
  should count as one category) is the entire schema change, same shape
  as `short_description`/`maktab_category` in earlier chunks.
- Every consumer already treats a room-price row as a flat object with a
  known, fixed set of fields (`room_type`, `price_aed`, plus
  `package_id`/`is_active`/`display_order` for internal use) —
  `lib/types/database.ts`'s `PackageRoomPriceRowShape`, both call sites
  in `lib/data/public.ts` (`getPackageBySlugAndType`'s per-package fetch
  and the batched `getPackageRoomPricesByPackageIds`), and the admin's
  `parseRoomPrices()` in `actions.ts`. None of these do anything
  structural (no joins, no assumptions about a fixed room-type list)
  that a new field would need to unpick.
- The admin form's room-pricing UI (`PackageForm.tsx`, "4. Room Pricing")
  is already a repeatable list of `room_type`/`price_aed` pairs with
  add/remove rows — adding a third parallel field (`category`, e.g. a
  small select) to that same repeatable-row pattern is a mechanical
  extension, the same shape of change already made for the Hajj
  itinerary-segments list a few rows up in this file (4 parallel fields
  instead of 2).
- The only genuinely new work is presentational, not structural: if
  Haseeb wants prices visually grouped BY category on the detail page
  (rather than a flat list with a small category tag per row), that's a
  rendering change in `PackageDetail.tsx`/`HajjPackageCard.tsx`/
  `PackageCard.tsx` — real work, but the same scale as the tier-grouping
  already built for `PackageGrid`/`HajjPackageGrid`, not a schema
  redesign.

Not building this now, per the instruction — flagging it as ready to
pick up whenever real category data exists.

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
