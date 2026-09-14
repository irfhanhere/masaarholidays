-- Per-room pricing — masaar-client-data-round3.md, Section 2.
--
-- One hotel can have multiple room types, so this is its own table
-- rather than columns on `hotels` (the source's own reasoning).
--
-- rate_period_label is a deliberate simplification instead of a
-- seasonal-pricing engine: this pricing is explicitly date-bound ("Oct 1
-- to 30 Oct [2026]"), so the label keeps that visible on the room card
-- rather than presenting it as a permanent rate. Update/expire rows as
-- new rate sheets come in — no calendar system was asked for.
create table public.hotel_rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  room_type text not null, -- e.g. "Partial Haram", "Classic", "Deluxe double"
  price_ro numeric(10, 2), -- room only, nullable — not every room has both rate types
  price_bb numeric(10, 2), -- bed & breakfast
  bed_type text, -- e.g. "Double/King"
  notes text, -- e.g. "Complimentary upgrade to partial Haram view"
  rate_period_label text, -- e.g. "Oct 1-30, 2026"
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_rooms_has_a_price check (price_ro is not null or price_bb is not null),
  unique (hotel_id, room_type)
);

create index hotel_rooms_hotel_id_idx on public.hotel_rooms (hotel_id);

create trigger hotel_rooms_set_updated_at
  before update on public.hotel_rooms
  for each row execute function public.set_updated_at();

alter table public.hotel_rooms enable row level security;

-- Public read follows the same rule as every other content table: only
-- visible if the parent hotel is publicly visible (the 18 inactive
-- hotels' rooms stay hidden until Haseeb activates the hotel).
create policy "hotel_rooms_public_read" on public.hotel_rooms
  for select using (
    is_active and exists (
      select 1 from public.hotels h where h.id = hotel_rooms.hotel_id and h.is_active
    )
  );
create policy "hotel_rooms_admin_all" on public.hotel_rooms
  for all to authenticated using (true) with check (true);
