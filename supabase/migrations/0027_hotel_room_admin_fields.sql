-- Room-level admin-only confidence metadata — same pattern already
-- established for hotels.data_confidence/admin_caution_note
-- (0025_madinah_hotel_fields.sql), extended down to hotel_rooms now that
-- an admin UI for editing rooms exists (previously hotel_rooms could
-- only be seeded via migration/DML, never edited through the app).
alter table public.hotel_rooms
  add column if not exists data_confidence text,
  add constraint hotel_rooms_data_confidence_check
    check (data_confidence is null or data_confidence in ('verified', 'estimated', 'needs_verification')),
  add column if not exists admin_caution_note text;

comment on column public.hotel_rooms.data_confidence is
  'Admin-only — how reliable this room''s price is: verified, estimated, needs_verification. Never rendered publicly (see lib/data/public.ts''s explicit column list, mirroring hotels.data_confidence).';
comment on column public.hotel_rooms.admin_caution_note is
  'Admin-only free text — e.g. "rate converted from a third-party listing, confirm before relying on it". Never rendered publicly.';
