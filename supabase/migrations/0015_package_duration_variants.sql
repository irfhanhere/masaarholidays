-- Package duration variants — extends each tier (Essential/Signature/
-- Privé, for both Umrah and Hajj) to hold multiple `packages` rows, one
-- per duration option (e.g. 7/10/14 nights), instead of exactly one row
-- per tier.
--
-- `packages` stays a flat table — there is no new parent "tier" table.
-- Grouping is simply "same type + tier". Tier-level copy (title,
-- city_destination, inclusions_text, advance_booking_note, flight_note,
-- rate_disclaimer, validity_label, is_featured) is kept in sync across
-- sibling duration rows by the admin action layer (see
-- app/admin/(dashboard)/packages/actions.ts#savePackage's sibling-sync
-- update) rather than normalized into a separate table — every consumer
-- (public pages, PackageCard/PackageDetail, the admin list) already reads
-- a flat `packages` row via `select("*")`, so none of that had to change.
--
-- is_active/show_on_website, slug, the duration itself, hero image,
-- itinerary, room pricing (package_room_prices) and hotel selections
-- (package_hotels) all stay per-row — each duration is independently
-- publishable, e.g. a 7-night Essential option can go live before a
-- 10-night option does.
alter table public.packages
  add column if not exists duration_nights integer;

-- Backfill the 6 existing placeholder packages using the convention
-- already encoded in their duration_label text ("N Nights / N+1 Days" —
-- see 0012_package_extra_fields.sql's seed data), i.e. duration_nights =
-- duration_days - 1, not duration_days itself.
update public.packages
set duration_nights = duration_days - 1
where duration_nights is null;

alter table public.packages
  alter column duration_nights set not null,
  add constraint packages_duration_nights_check check (duration_nights > 0);

-- One row per (type, tier, duration_nights) — stops two "Essential Umrah,
-- 7 nights" rows from being created by mistake. Title/slug can still
-- differ per admin edit; this only blocks an exact duplicate duration
-- within the same tier.
create unique index packages_tier_duration_unique_idx
  on public.packages (type, tier, duration_nights);

comment on column public.packages.duration_nights is
  'Nights for this specific duration variant of the tier, e.g. 7/10/14. Multiple packages rows can share the same (type, tier) to offer several duration options for one tier; duration_days is kept as duration_nights + 1.';
