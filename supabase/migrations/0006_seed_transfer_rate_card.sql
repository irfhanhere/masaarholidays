-- Seeds the vehicle fleet + route rate card exactly as given in
-- masaar-client-data-round2.md, Section 3. Routes are seeded active
-- (route names/vehicle availability are fine to show publicly — it's
-- only the price_aed values that stay admin-only, enforced by RLS in
-- 0005_transfer_rate_card.sql, not by omitting the rows here).

insert into public.transfer_vehicles (name, display_order) values
  ('Toyota Camry', 1),
  ('Hyundai Staria', 2),
  ('GMC XL Yukon', 3),
  ('Hiace Grand Cabin', 4),
  ('Toyota Coaster', 5)
on conflict (name) do nothing;

insert into public.transfers (route_name, slug, transfer_type, description, is_active, display_order) values
  ('Jeddah Airport → Makkah Hotel', 'jeddah-airport-to-makkah-hotel', 'airport', null, true, 1),
  ('Makkah Hotel → Jeddah Airport', 'makkah-hotel-to-jeddah-airport', 'airport', null, true, 2),
  ('Jeddah Airport → Madinah Hotel', 'jeddah-airport-to-madinah-hotel', 'airport', null, true, 3),
  ('Madinah Hotel → Jeddah Airport', 'madinah-hotel-to-jeddah-airport', 'airport', null, true, 4),
  ('Madinah Airport → Madinah Hotel', 'madinah-airport-to-madinah-hotel', 'airport', null, true, 5),
  ('Madinah Hotel → Madinah Airport', 'madinah-hotel-to-madinah-airport', 'airport', null, true, 6),
  ('Makkah Hotel ↔ Madinah Hotel', 'makkah-hotel-to-madinah-hotel', 'intercity', 'Direct route, either direction.', true, 7),
  ('Makkah Hotel ↔ Madinah Hotel (via Badr / Roya Well)', 'makkah-hotel-to-madinah-hotel-via-badr', 'intercity', 'Via Badr / Roya Well, either direction.', true, 8),
  ('Makkah / Madinah Ziyarat', 'makkah-madinah-ziyarat', 'ziyarat', null, true, 9),
  ('Makkah / Madinah → Train Station', 'makkah-madinah-train-station', 'train', null, true, 10),
  ('Jeddah → Taif → Return', 'jeddah-taif-return', 'day-trip', null, true, 11),
  ('Makkah → Taif → Return', 'makkah-taif-return', 'day-trip', null, true, 12)
on conflict (slug) do nothing;

-- Rate matrix: route x vehicle -> price (AED). Written as one CTE per
-- vehicle joining on route slug + vehicle name, so a re-run is idempotent
-- (on conflict do nothing) and each number below is traceable back to the
-- source table's column.
with rates(route_slug, vehicle_name, price_aed) as (
  values
    -- Jeddah Airport -> Makkah Hotel
    ('jeddah-airport-to-makkah-hotel', 'Toyota Camry', 250),
    ('jeddah-airport-to-makkah-hotel', 'Hyundai Staria', 300),
    ('jeddah-airport-to-makkah-hotel', 'GMC XL Yukon', 500),
    ('jeddah-airport-to-makkah-hotel', 'Hiace Grand Cabin', 350),
    ('jeddah-airport-to-makkah-hotel', 'Toyota Coaster', 500),
    -- Makkah Hotel -> Jeddah Airport
    ('makkah-hotel-to-jeddah-airport', 'Toyota Camry', 200),
    ('makkah-hotel-to-jeddah-airport', 'Hyundai Staria', 250),
    ('makkah-hotel-to-jeddah-airport', 'GMC XL Yukon', 400),
    ('makkah-hotel-to-jeddah-airport', 'Hiace Grand Cabin', 300),
    ('makkah-hotel-to-jeddah-airport', 'Toyota Coaster', 450),
    -- Jeddah Airport -> Madinah Hotel
    ('jeddah-airport-to-madinah-hotel', 'Toyota Camry', 500),
    ('jeddah-airport-to-madinah-hotel', 'Hyundai Staria', 550),
    ('jeddah-airport-to-madinah-hotel', 'GMC XL Yukon', 950),
    ('jeddah-airport-to-madinah-hotel', 'Hiace Grand Cabin', 650),
    ('jeddah-airport-to-madinah-hotel', 'Toyota Coaster', 950),
    -- Madinah Hotel -> Jeddah Airport
    ('madinah-hotel-to-jeddah-airport', 'Toyota Camry', 450),
    ('madinah-hotel-to-jeddah-airport', 'Hyundai Staria', 500),
    ('madinah-hotel-to-jeddah-airport', 'GMC XL Yukon', 850),
    ('madinah-hotel-to-jeddah-airport', 'Hiace Grand Cabin', 600),
    ('madinah-hotel-to-jeddah-airport', 'Toyota Coaster', 850),
    -- Madinah Airport -> Madinah Hotel
    ('madinah-airport-to-madinah-hotel', 'Toyota Camry', 125),
    ('madinah-airport-to-madinah-hotel', 'Hyundai Staria', 175),
    ('madinah-airport-to-madinah-hotel', 'GMC XL Yukon', 275),
    ('madinah-airport-to-madinah-hotel', 'Hiace Grand Cabin', 300),
    ('madinah-airport-to-madinah-hotel', 'Toyota Coaster', 400),
    -- Madinah Hotel -> Madinah Airport
    ('madinah-hotel-to-madinah-airport', 'Toyota Camry', 100),
    ('madinah-hotel-to-madinah-airport', 'Hyundai Staria', 150),
    ('madinah-hotel-to-madinah-airport', 'GMC XL Yukon', 225),
    ('madinah-hotel-to-madinah-airport', 'Hiace Grand Cabin', 250),
    ('madinah-hotel-to-madinah-airport', 'Toyota Coaster', 350),
    -- Makkah Hotel <-> Madinah Hotel
    ('makkah-hotel-to-madinah-hotel', 'Toyota Camry', 400),
    ('makkah-hotel-to-madinah-hotel', 'Hyundai Staria', 450),
    ('makkah-hotel-to-madinah-hotel', 'GMC XL Yukon', 800),
    ('makkah-hotel-to-madinah-hotel', 'Hiace Grand Cabin', 550),
    ('makkah-hotel-to-madinah-hotel', 'Toyota Coaster', 800),
    -- Makkah Hotel <-> Madinah Hotel (via Badr / Roya Well)
    ('makkah-hotel-to-madinah-hotel-via-badr', 'Toyota Camry', 550),
    ('makkah-hotel-to-madinah-hotel-via-badr', 'Hyundai Staria', 650),
    ('makkah-hotel-to-madinah-hotel-via-badr', 'GMC XL Yukon', 1000),
    ('makkah-hotel-to-madinah-hotel-via-badr', 'Hiace Grand Cabin', 750),
    ('makkah-hotel-to-madinah-hotel-via-badr', 'Toyota Coaster', 1000),
    -- Makkah / Madinah Ziyarat
    ('makkah-madinah-ziyarat', 'Toyota Camry', 200),
    ('makkah-madinah-ziyarat', 'Hyundai Staria', 275),
    ('makkah-madinah-ziyarat', 'GMC XL Yukon', 400),
    ('makkah-madinah-ziyarat', 'Hiace Grand Cabin', 300),
    ('makkah-madinah-ziyarat', 'Toyota Coaster', 450),
    -- Makkah / Madinah -> Train Station
    ('makkah-madinah-train-station', 'Toyota Camry', 125),
    ('makkah-madinah-train-station', 'Hyundai Staria', 175),
    ('makkah-madinah-train-station', 'GMC XL Yukon', 300),
    ('makkah-madinah-train-station', 'Hiace Grand Cabin', 250),
    ('makkah-madinah-train-station', 'Toyota Coaster', 300),
    -- Jeddah -> Taif -> Return
    ('jeddah-taif-return', 'Toyota Camry', 575),
    ('jeddah-taif-return', 'Hyundai Staria', 725),
    ('jeddah-taif-return', 'GMC XL Yukon', 1100),
    ('jeddah-taif-return', 'Hiace Grand Cabin', 850),
    ('jeddah-taif-return', 'Toyota Coaster', 1100),
    -- Makkah -> Taif -> Return
    ('makkah-taif-return', 'Toyota Camry', 425),
    ('makkah-taif-return', 'Hyundai Staria', 575),
    ('makkah-taif-return', 'GMC XL Yukon', 950),
    ('makkah-taif-return', 'Hiace Grand Cabin', 675),
    ('makkah-taif-return', 'Toyota Coaster', 950)
)
insert into public.transfer_route_rates (transfer_id, vehicle_id, price_aed)
select t.id, v.id, rates.price_aed
from rates
join public.transfers t on t.slug = rates.route_slug
join public.transfer_vehicles v on v.name = rates.vehicle_name
on conflict (transfer_id, vehicle_id) do nothing;
