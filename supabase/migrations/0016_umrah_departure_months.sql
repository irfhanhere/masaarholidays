-- "Departure Month" browsing layer for Umrah only (not Hajj) — a
-- content/marketing wrapper around the existing packages table, not a
-- new pricing dimension. Each month page shows the exact same shared
-- Essential/Signature/Privé package grid (with their duration variants)
-- already used on /umrah; nothing here duplicates package data.
create table public.umrah_departure_months (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- Haseeb sets this directly, e.g. "january-2027" — no year is assumed/generated for him
  display_label text not null, -- e.g. "January 2027"
  hero_image_url text,
  hero_headline text,
  hero_subtext text, -- short seasonal blurb, e.g. "Comfortable autumn temperatures..."
  best_for_note text, -- e.g. family suitability — NOT a "Departure Airports" card (UK-competitor-specific, irrelevant to Masaar)
  booking_advice_note text,
  sort_order integer not null default 0, -- controls the header nav dropdown order
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index umrah_departure_months_sort_order_idx on public.umrah_departure_months (sort_order);

create trigger umrah_departure_months_set_updated_at
  before update on public.umrah_departure_months
  for each row execute function public.set_updated_at();

alter table public.umrah_departure_months enable row level security;

-- Same pattern as hotels/transfers/visa_types: public only ever sees
-- active rows (this is also what keeps inactive months out of the
-- sitemap and returns a 404 for /umrah/departures/[slug] when inactive —
-- both read through this same RLS-gated query, not a separate check).
create policy "umrah_departure_months_public_read" on public.umrah_departure_months
  for select using (is_active);
create policy "umrah_departure_months_admin_all" on public.umrah_departure_months
  for all to authenticated using (true) with check (true);

-- Seed all 12 months as inactive placeholders, generic (no year) — Haseeb
-- edits display_label/slug per row when he activates a real departure
-- period (e.g. renaming "January" to "January 2027"), or duplicates the
-- pattern into additional rows for other years via the admin screen.
insert into public.umrah_departure_months (slug, display_label, sort_order) values
  ('january', 'January', 1),
  ('february', 'February', 2),
  ('march', 'March', 3),
  ('april', 'April', 4),
  ('may', 'May', 5),
  ('june', 'June', 6),
  ('july', 'July', 7),
  ('august', 'August', 8),
  ('september', 'September', 9),
  ('october', 'October', 10),
  ('november', 'November', 11),
  ('december', 'December', 12)
on conflict (slug) do nothing;
