-- Hotel page filters — masaar-client-data-round2.md, Section 2.
--
-- board_basis already existed on `hotels` (0001_init.sql). Adding the two
-- new filter dimensions here. Modelled as single nullable text columns on
-- `hotels` (not a separate room-type table) to match the existing
-- simplification where `hotels` already represents one room_type/
-- board_basis per row rather than multiple room types per property — a
-- true multi-room-type model is a larger schema change for a later pass
-- if Haseeb needs to show several room configurations per hotel.
--
-- All nullable, all left null on existing rows: these are filter
-- dimensions, not guaranteed facts about every property, per the source
-- note ("leave blank rather than guessing per hotel").
alter table public.hotels
  add column if not exists cancellation_policy text,
  add column if not exists view_type text;

comment on column public.hotels.board_basis is
  'Filter dimension, e.g. "Room Only" | "Breakfast" | "Half Board". Free text (not enum) so Haseeb can phrase it per hotel; the Hotels page filter UI derives its checkbox options from whatever distinct values exist.';
comment on column public.hotels.cancellation_policy is
  'Filter dimension, e.g. "Non-refundable" | "Part-refundable" | "Free cancellation". Nullable — leave blank until confirmed.';
comment on column public.hotels.view_type is
  'Filter dimension, e.g. "Kaaba View" | "Haram View". Nullable — not every room has one; leave blank rather than guessing.';
