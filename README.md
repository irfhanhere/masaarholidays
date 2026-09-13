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
3. Run the SQL in `supabase/migrations/` against your project, in order —
   either paste them into the Supabase SQL Editor, or via the CLI:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. Create your first admin user: Supabase Dashboard → Authentication →
   Users → Add User. (There is no public sign-up — Phase 1 has admin-only
   accounts, per the brief.)
5. Sign in at `/admin/login`.

## Database schema

`supabase/migrations/0001_init.sql` — packages (tiers + Plus upgrades),
hotels, transfers, visa content (4 document-set contexts), testimonials
(draft/published), enquiries, currency_rates, plus Row Level Security
policies (public reads only published/active rows; all writes require an
authenticated admin session).

`supabase/migrations/0002_seed_visa_contexts.sql` — seeds the 4 required
visa document contexts as empty shells (no copy).

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
