-- Placeholder Umrah/Hajj packages — masaar-client-data-round3.md, Section
-- 4. Random/placeholder pricing, NOT real numbers from Haseeb — seeded
-- is_active = false AND show_on_website = false so they populate the
-- admin panel for review/layout-testing (Admin -> Packages) but can
-- never appear on the public Umrah/Hajj pages (both public queries in
-- lib/data/public.ts#getPublishedPackages filter on both flags). Same
-- "never show invented content to a real visitor" rule already applied
-- to the inactive hotels.
--
-- Itinerary is intentionally NOT a fabricated day-by-day — that would be
-- inventing marketing content, which is exactly what's being avoided.
-- Each package gets a single placeholder itinerary line saying so.
with new_packages(type, tier, title, city_destination, duration_days, is_featured) as (
  values
    ('umrah'::public.package_type, 'essential'::public.package_tier, 'Essential Umrah', 'Makkah / Madinah', 7, false),
    ('umrah'::public.package_type, 'signature'::public.package_tier, 'Signature Umrah', 'Makkah / Madinah', 10, true),
    ('umrah'::public.package_type, 'prive'::public.package_tier, 'Privé Umrah', 'Makkah / Madinah', 10, false),
    ('hajj'::public.package_type, 'essential'::public.package_tier, 'Essential Hajj', 'Makkah / Madinah', 14, false),
    ('hajj'::public.package_type, 'signature'::public.package_tier, 'Signature Hajj', 'Makkah / Madinah', 14, true),
    ('hajj'::public.package_type, 'prive'::public.package_tier, 'Privé Hajj', 'Makkah / Madinah', 16, false)
),
inserted as (
  insert into public.packages (type, tier, title, slug, city_destination, duration_days, is_featured, is_active, show_on_website, itinerary)
  select
    type, tier, title,
    lower(type::text) || '-' || lower(tier::text) || '-placeholder',
    city_destination, duration_days, is_featured,
    false, false, -- draft/inactive: admin-only until Haseeb reviews real numbers
    jsonb_build_array(jsonb_build_object('day', 1, 'items', jsonb_build_array('Placeholder itinerary — pending real package details from Haseeb.')))
  from new_packages
  on conflict (slug) do nothing
  returning id, type, tier
),
room_prices(type, tier, room_type, price_aed, sort) as (
  values
    ('umrah'::public.package_type, 'essential'::public.package_tier, 'Quad', 2950, 1),
    ('umrah'::public.package_type, 'essential'::public.package_tier, 'Triple', 3450, 2),
    ('umrah'::public.package_type, 'essential'::public.package_tier, 'Double', 3950, 3),
    ('umrah'::public.package_type, 'signature'::public.package_tier, 'Quad', 4950, 1),
    ('umrah'::public.package_type, 'signature'::public.package_tier, 'Triple', 5550, 2),
    ('umrah'::public.package_type, 'signature'::public.package_tier, 'Double', 6450, 3),
    ('umrah'::public.package_type, 'prive'::public.package_tier, 'Quad', 8950, 1),
    ('umrah'::public.package_type, 'prive'::public.package_tier, 'Triple', 10450, 2),
    ('umrah'::public.package_type, 'prive'::public.package_tier, 'Double', 12450, 3),
    ('hajj'::public.package_type, 'essential'::public.package_tier, 'Quad', 12950, 1),
    ('hajj'::public.package_type, 'essential'::public.package_tier, 'Triple', 14450, 2),
    ('hajj'::public.package_type, 'essential'::public.package_tier, 'Double', 16950, 3),
    ('hajj'::public.package_type, 'signature'::public.package_tier, 'Quad', 16950, 1),
    ('hajj'::public.package_type, 'signature'::public.package_tier, 'Triple', 18450, 2),
    ('hajj'::public.package_type, 'signature'::public.package_tier, 'Double', 21950, 3),
    ('hajj'::public.package_type, 'prive'::public.package_tier, 'Quad', 24950, 1),
    ('hajj'::public.package_type, 'prive'::public.package_tier, 'Triple', 27450, 2),
    ('hajj'::public.package_type, 'prive'::public.package_tier, 'Double', 31950, 3)
),
priced as (
  insert into public.package_room_prices (package_id, room_type, price_aed, display_order)
  select inserted.id, room_prices.room_type, room_prices.price_aed, room_prices.sort
  from inserted
  join room_prices on room_prices.type = inserted.type and room_prices.tier = inserted.tier
  returning package_id, price_aed
)
update public.packages p
set starting_price_aed = agg.min_price
from (select package_id, min(price_aed) as min_price from priced group by package_id) agg
where p.id = agg.package_id;
