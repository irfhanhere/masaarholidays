-- Seeds the real room pricing from masaar-client-data-round3.md, Section
-- 2 ("Oct 1-30 [2026]" rate sheet), matched to hotels via the Round
-- 2 names already in the database (see the reconciliation table in
-- 0008_hotel_walk_terrain.sql for why e.g. "Clock Tower Fairmont" here
-- maps to the existing "Makkah Clock Royal Tower" row).
--
-- Note: the source table lists 17 rows but its own summary says "16 real
-- room prices" — "Makkah Hotels & Towers" (Partial Haram, 1460/1555) and
-- "Makkah Towers" (Double room, 1151/1246) both map to the same hotel
-- ("Makkah Hotel & Towers") with different room types/prices, which is
-- exactly what this table is for (one hotel, multiple room types) — kept
-- both rather than dropping one to force a count of 16, since both look
-- like genuine distinct room-type rows rather than a duplicate.
with rooms(hotel_name, room_type, price_ro, price_bb, bed_type, notes) as (
  values
    ('Mövenpick Hotel & Residences Hajar Tower Makkah', 'Double/King', null::numeric, 1044::numeric, 'Double/King', 'Complimentary upgrade to partial Haram view'),
    ('Al Marwa Rayhaan', 'Double/King', null, 1175, 'Double/King', 'Complimentary upgrade to partial Haram view'),
    ('Swissôtel Makkah', 'Classic', null, 1580, null, null),
    ('Swissôtel Al Maqam', 'Classic', null, 1165, null, null),
    ('Intercontinental Dar Al Tawhid', 'Classic', null, 1880, null, null),
    ('Makkah Hotel & Towers', 'Partial Haram', 1460, 1555, null, null),
    ('Al Ghufran Safwah', 'Standard', 1181, 1377, null, null),
    ('Zamzam Pullman', 'Classic', null, 1406, null, null),
    ('Raffles Makkah Palace', 'One-bedroom suite', null, 2200, null, null),
    ('Makkah Clock Royal Tower', 'King room', null, 1670, null, null),
    ('Conrad Jabal Omar', 'Double room', null, 1238, null, null),
    ('Jabal Omar Hyatt Regency', 'King room', 1211, 1286, null, null),
    ('Hilton Suites Makkah', 'Standard', null, 1250, null, null),
    ('Hilton Convention Makkah', 'King room', 908, 967, null, null),
    ('Address Jabal Omar', 'Double room', 852, 961, null, null),
    ('Jumeirah Jabal Omar', 'Deluxe double', 1170, 1326, null, null),
    ('Makkah Hotel & Towers', 'Double room', 1151, 1246, null, null)
)
insert into public.hotel_rooms (hotel_id, room_type, price_ro, price_bb, bed_type, notes, rate_period_label, display_order)
select h.id, rooms.room_type, rooms.price_ro, rooms.price_bb, rooms.bed_type, rooms.notes, 'Oct 1-30, 2026', row_number() over (partition by h.id)
from rooms
join public.hotels h on h.name = rooms.hotel_name
on conflict (hotel_id, room_type) do nothing;
