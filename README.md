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

**None of 0003–0007 have been applied to the live project yet** — write
them, verify them, but don't assume the data is there until you've run
them (Step 3 above).

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

## Language routing (English + Arabic)

No page files are duplicated per locale. `middleware.ts` rewrites
`/ar/*` internally to the same unprefixed route tree and stamps an
`x-locale` request header; `lib/i18n.ts#getRequestLocale()` reads it back
in Server Components (root `layout.tsx` for `<html lang/dir>`, every
public page's `generateMetadata` for hreflang/canonical via
`buildPageMetadata()`). Practical effect: `/ar/umrah` renders the exact
same Umrah page component as `/umrah`, correctly tagged `lang="ar"
dir="rtl"` — same "Copy pending" placeholders, no invented Arabic text.

- Header (`LanguageSwitcher.tsx`) and a one-time first-visit banner
  (`LanguagePrompt.tsx`, browser-language-detected, Arabic-only for now,
  never auto-redirects) both live in `src/components/site/`.
- `/ar/*` is `noindex` until real Arabic copy exists — a deliberate call
  (see the comment in `lib/i18n.ts#localeRobots`) so hreflang doesn't
  tell Google "this is the Arabic version" of what's actually English
  text. Flip it once real translation lands.
- **RTL is document-direction-correct, not visually re-flowed.**
  `dir="rtl"` is set correctly and the browser's default RTL flow
  mirrors most of the layout reasonably well (flexbox rows reverse
  automatically), but no pass was done converting physical Tailwind
  utilities (`ml-`, `pl-`, `text-left`) to logical ones (`ms-`, `ps-`,
  `text-start`) — some spacing will look slightly off in RTL until that
  pass happens.
- Locale-aware links: Header + Footer nav are localized. Not yet done:
  in-page links (Hero breadcrumbs, hotel page `#makkah`/`#madinah`
  anchors are fine since they're fragments, but a hardcoded `/contact`
  href inside page body copy would drop back to English) — low-traffic
  spots, flagged rather than silently left.
- Every public page now reads `headers()` (for locale), so pages that
  were previously statically prerendered are now server-rendered on
  every request. Reasonable trade-off for correct hreflang; revisit with
  ISR/PPR if it matters at scale.

## Known simplifications (flagged for a follow-up pass)

- Image fields are plain URL inputs — Supabase Storage upload UI isn't wired yet.
- Package itinerary is a simple one-line-per-day textarea, not the full
  multi-item day accordion in `ADMIN-PACKAGE-EDIT.png`.
- Enquiry detail is its own page, not the slide-over panel in
  `ADMIN-EQNUIRIES.png`.
- Currency conversion: the switcher in the header is UI-only — it doesn't
  yet convert displayed AED prices using `currency_rates`.
- WhatsApp templates (brief Part 6) are code constants in
  `src/lib/whatsapp-templates.ts`, not an admin-editable table yet.
