-- Migration: 0057_addon_catalog_private_trip_link.sql
-- Links optional add-on catalog rows (e.g. "Private Makkah Ziyarat") to a
-- real private_trips record, so the public Optional Add-ons section and
-- its enquiry basket show the trip's actual name/description/image
-- instead of a disconnected hardcoded placeholder. Nullable — an add-on
-- like Visa or Flights has no private trip to link.
--
-- Apply manually in Supabase SQL Editor.

alter table public.package_addons_catalog
  add column if not exists private_trip_id uuid references public.private_trips(id) on delete set null;

comment on column public.package_addons_catalog.private_trip_id is
  'Optional link to a private_trips row. When set, the public site shows that trip''s real name/description/image/duration instead of this catalog row''s own text fields.';

-- Best-effort backfill: link the two seeded Ziyarat add-on rows to their
-- unambiguous matching private trip by destination. "Private Sightseeing"
-- is deliberately left unlinked — it doesn't map 1:1 to either of the two
-- existing trips, and guessing would misrepresent it; an admin can link it
-- explicitly once the intended trip is clear.
update public.package_addons_catalog addon
set private_trip_id = trip.id
from public.private_trips trip
where addon.private_trip_id is null
  and (
    (addon.key_slug = 'makkah-ziyarat' and trip.destination = 'Makkah')
    or (addon.key_slug = 'madinah-ziyarat' and trip.destination = 'Madinah')
  );
