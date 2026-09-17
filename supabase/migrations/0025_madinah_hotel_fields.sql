-- Madinah hotels phase — extends the existing hotels/hotel_rooms schema
-- (0001_init.sql, 0004_hotel_filters.sql, 0008_hotel_walk_terrain.sql,
-- 0009_hotel_rooms.sql) rather than duplicating it. Inventory before this
-- migration: hotels has 30 active Makkah rows using a single
-- distance_from_haram_meters/walk_time_minutes pair (fine for Makkah,
-- where there's one Haram); Madinah needs a men's/ladies' gate split
-- instead, since the two entrances can differ by several minutes. Every
-- column below is nullable and additive — no existing column is renamed,
-- retyped or dropped, and every existing Makkah row is left exactly as
-- it is (all UPDATEs in the seed migration that follows this one are
-- scoped to newly-inserted Madinah rows only).
--
-- Reference mockups (attached to the brief) show a fuller detail-page
-- template than what's currently live — gallery, map, room size/bed/bath,
-- board-basis + cancellation badges, feature strip. Per direction, the
-- shared template is being upgraded to match for BOTH cities (Makkah
-- hotels gain these fields too, gracefully empty/hidden until populated)
-- rather than forking a separate Madinah-only template.

alter table public.hotels
  -- General proximity/accessibility fields — apply to both cities, not
  -- Madinah-specific. terrain_note (0008) already covers free-text
  -- description; these are the more structured facts the reference asks
  -- for that don't yet exist at all.
  add column if not exists route_type text, -- e.g. "flat", "plaza-crossing", "road-crossing" — free text like board_basis/view_type, not an enum (same reasoning as the city column's own comment: "free text, not enum — extensible")
  add column if not exists elderly_family_suitability_note text,
  add column if not exists shuttle_available boolean not null default false,
  add column if not exists shuttle_note text,
  add column if not exists accessibility_note text, -- lifts / step-free access, described in free text rather than separate booleans, since confidence in these facts varies per hotel
  add column if not exists google_maps_url text,
  add column if not exists gallery_image_urls text[] not null default '{}',

  -- Madinah-specific — always null for Makkah rows, which keep using the
  -- existing distance_from_haram_meters/walk_time_minutes pair.
  add column if not exists mens_gate_walk_minutes_min integer,
  add column if not exists mens_gate_walk_minutes_max integer,
  add column if not exists ladies_gate_walk_minutes_min integer,
  add column if not exists ladies_gate_walk_minutes_max integer,
  add column if not exists nearest_mens_gate text,
  add column if not exists nearest_ladies_gate text,
  add column if not exists in_haram_plaza_walk_note text,
  add column if not exists zone text,
  -- Which gate's time is shown on the hotel card's single walk-time badge
  -- (the card only has room for one figure) — admin picks whichever is
  -- the more representative/primary approach for that hotel.
  add column if not exists primary_gate text,
  add constraint hotels_primary_gate_check check (primary_gate is null or primary_gate in ('mens', 'ladies')),

  -- Admin-only metadata — never selected/rendered on the public site (see
  -- lib/data/public.ts#getActiveHotels/getHotelBySlug, which explicitly
  -- omit these two columns from their select lists rather than relying on
  -- the UI alone to hide them).
  add column if not exists data_confidence text,
  add constraint hotels_data_confidence_check
    check (data_confidence is null or data_confidence in ('verified', 'estimated', 'needs_verification')),
  add column if not exists admin_caution_note text;

comment on column public.hotels.primary_gate is
  '"mens" or "ladies" — which gate time (of the two Madinah gate fields) the public hotel card''s single walk-time badge shows. Null/unused for Makkah.';
comment on column public.hotels.data_confidence is
  'Admin-only — how reliable this hotel''s proximity/facility data is: verified (confirmed source), estimated (reasonable inference), needs_verification (flag for follow-up). Never rendered publicly.';
comment on column public.hotels.admin_caution_note is
  'Admin-only free text — things Haseeb should know before relying on or featuring this listing (e.g. "price TBC", "reviews flag room condition"). Never rendered publicly.';
comment on column public.hotels.gallery_image_urls is
  'Additional photos for the detail page''s Hotel Gallery grid, beyond the single hero image_url. Paste-a-URL, same convention as image_url — no upload UI yet.';

-- Room-level additions — the reference's Room Options cards show size/
-- bed/bathroom counts, a room photo, and board-basis/cancellation/view
-- badges that don't exist on hotel_rooms today. board_basis_options and
-- cancellation_policy_options are explicitly DISPLAY-ONLY (which options
-- exist for this room, shown as static badges) — there is no real-time
-- rate feed behind this site, so nothing here recalculates a price when
-- clicked; that would misrepresent what the data actually is.
alter table public.hotel_rooms
  add column if not exists image_url text,
  add column if not exists size_sqm integer,
  add column if not exists bed_count integer,
  add column if not exists bathroom_count integer,
  add column if not exists view_options text[] not null default '{}',
  add column if not exists board_basis_options text[] not null default '{}',
  add column if not exists cancellation_policy_options text[] not null default '{}';

comment on column public.hotel_rooms.view_options is
  'Which views this room type can have, e.g. {"Kaaba View","Haram View"} — display-only badges, not a selectable option that changes price.';
comment on column public.hotel_rooms.board_basis_options is
  'Which board bases this room type is available under, e.g. {"Room Only","Breakfast","Half Board"} — display-only badges (see hotel_rooms.view_options comment).';
comment on column public.hotel_rooms.cancellation_policy_options is
  'Which cancellation policies this room type offers, e.g. {"Non-refundable","Free cancellation"} — display-only badges (see hotel_rooms.view_options comment).';
