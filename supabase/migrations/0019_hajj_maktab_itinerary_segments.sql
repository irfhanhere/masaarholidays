-- Two Hajj-only fields on `packages` — apply only when type = 'hajj';
-- always null/empty for Umrah rows, which keep their existing fields
-- (title/inclusions_text etc., and the day-by-day `itinerary` column)
-- completely unchanged.
--
-- maktab_category: free text (not an enum — Haseeb may phrase this
-- differently per package, e.g. "A-Category" vs "VIP A-Category"),
-- tier-level — synced across duration-variant siblings the same way as
-- title/inclusions_text/short_description (see
-- app/admin/(dashboard)/packages/actions.ts#savePackage's sibling-sync
-- update).
--
-- itinerary_segments: replaces the flat day-by-day `itinerary` format
-- for Hajj specifically — each segment is one city/location with its
-- own nights and board type, e.g. "Madinah, 5 nights, Half Board".
-- Per-duration, NOT synced — a 10-day and a 17-day Hajj package
-- genuinely need different segments, same reasoning already applied to
-- the plain `itinerary` column (masaar-client-data-round3.md's
-- placeholder-package chunk).
alter table public.packages
  add column if not exists maktab_category text,
  add column if not exists itinerary_segments jsonb not null default '[]'::jsonb;

comment on column public.packages.maktab_category is
  'Hajj only — free text maktab/tent category, e.g. "A-Category". Tier-level, synced across duration siblings. Always null for Umrah.';
comment on column public.packages.itinerary_segments is
  'Hajj only — structured city/nights/board_type/note segments, replacing the day-by-day itinerary column for Hajj. Per-duration, not synced. Always empty for Umrah, which keeps using the itinerary column.';
