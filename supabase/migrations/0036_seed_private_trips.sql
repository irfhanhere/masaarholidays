-- Seed WhatsApp Template for Private Trips
insert into public.whatsapp_templates (key, label, template_text, placeholders, display_order)
values (
  'privateTripEnquiry',
  'Private Trips — Enquiry (trip detail page & cards)',
  'Assalamu Alaikum, I''d like to enquire about the {{tripName}} private trip ({{destination}} — {{duration}}).',
  array['tripName', 'destination', 'duration'],
  14
)
on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  display_order = excluded.display_order;


-- Seed Private Trips
-- 1. Makkah Private Sightseeing
insert into public.private_trips (
  id, name, slug, destination, short_description, duration, trip_type,
  featured_image_url, hero_image_url, status, pickup_point, time_slots,
  important_note, meta_title, meta_description, display_order
) values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Makkah Private Sightseeing',
  'makkah-private-sightseeing',
  'Makkah',
  'Explore the historic and spiritual landmarks of Makkah.',
  '2 – 2.5 hrs',
  'Private Sightseeing',
  '/trips/PRIVATE-TRIP-MAKKAH-CARD.png',
  '/trips/PRIVATE-TRIP-MAKKAH-HERO.png',
  'published',
  'hotel_lobby',
  '["7:00 AM", "8:00 AM", "9:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"]'::jsonb,
  'Please be ready in your hotel lobby 10 minutes before the trip starts. Driver will meet you in the lobby.',
  'Makkah Private Sightseeing | Masaar Holidays',
  'Explore key spiritual and historical landmarks across Makkah with a comfortable, private vehicle and dedicated driver.',
  1
) on conflict (slug) do update set
  name = excluded.name,
  destination = excluded.destination,
  short_description = excluded.short_description,
  duration = excluded.duration,
  featured_image_url = excluded.featured_image_url,
  hero_image_url = excluded.hero_image_url,
  status = excluded.status;

-- Makkah Stops
delete from public.private_trip_stops where trip_id = 'a1b2c3d4-0001-4000-8000-000000000001';
insert into public.private_trip_stops (
  trip_id, stop_number, stop_name, visit_type, visit_duration, short_description
) values
  ('a1b2c3d4-0001-4000-8000-000000000001', 1, 'Hotel', 'Pickup', null, 'Pickup from your hotel lobby.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 2, 'Jabal Al Nour (Cave Hira)', 'Visit', '30 – 45 min', 'The historic mountain of light and cave of first revelation.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 3, 'Jabal Thawr', 'Visit', '20 – 30 min', 'The cave of sanctuary during the blessed migration.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 4, 'Mina & Muzdalifah', 'Pass By', null, 'Scenic drive through the landmark tent city and sacred Hajj grounds.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 5, 'Plains of Arafat & Mount of Mercy', 'Visit', '25 – 30 min', 'The blessed plains of Wuquf and Jabal Al Rahmah.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 6, 'Hotel', 'Drop Off', null, 'Comfortable return drop-off to your hotel.');

-- 2. Madinah Private Sightseeing
insert into public.private_trips (
  id, name, slug, destination, short_description, duration, trip_type,
  featured_image_url, hero_image_url, status, pickup_point, time_slots,
  important_note, meta_title, meta_description, display_order
) values (
  'a1b2c3d4-0001-4000-8000-000000000002',
  'Madinah Private Sightseeing',
  'madinah-private-sightseeing',
  'Madinah',
  'A carefully arranged private journey through selected places around Madinah.',
  '2 – 2.5 hrs',
  'Private Sightseeing',
  '/trips/PRIVATE-TRIP-MADINAH-CARD.png',
  '/trips/PRIVATE-TRIP-MADINAH-HERO.jpg',
  'published',
  'hotel_lobby',
  '["7:00 AM", "8:00 AM", "9:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"]'::jsonb,
  'Please be ready in your hotel lobby 10 minutes before the trip starts. Driver will meet you in the lobby.',
  'Madinah Private Sightseeing | Masaar Holidays',
  'Visit the sacred and historical places in Madinah with a private vehicle at a relaxed and comfortable pace.',
  2
) on conflict (slug) do update set
  name = excluded.name,
  destination = excluded.destination,
  short_description = excluded.short_description,
  duration = excluded.duration,
  featured_image_url = excluded.featured_image_url,
  hero_image_url = excluded.hero_image_url,
  status = excluded.status;

-- Madinah Stops
delete from public.private_trip_stops where trip_id = 'a1b2c3d4-0001-4000-8000-000000000002';
insert into public.private_trip_stops (
  trip_id, stop_number, stop_name, image_url, visit_type, visit_duration, short_description
) values
  ('a1b2c3d4-0001-4000-8000-000000000002', 1, 'Hotel', null, 'Pickup', null, 'Pickup from your hotel lobby'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 2, 'Mount Uhud', '/trips/STOP-MADINAH-MOUNT-UHUD.png', 'Visit', '25 – 30 min', 'Explore the historic Uhud mountain.'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 3, 'Shuhada Uhud Cemetery', '/trips/STOP-MADINAH-SHUHADA-UHUD.png', 'Pass By', null, 'Drive past the cemetery of martyrs.'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 4, 'Mount Rumah', '/trips/STOP-MADINAH-MOUNT-RUMAH.png', 'Pass By', null, 'View Mount Rumah from the route.'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 5, 'Masjid Quba', null, 'Visit', '20 – 25 min', 'The first mosque built in Islamic history.'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 6, 'Garden Salman Farsi', null, 'Visit', '15 min', 'Historic date palm grove of the companion Salman Al-Farsi.'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 7, 'Ghar / Well', null, 'Visit', '10 – 15 min', 'Historic well and resting point in Madinah.'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 8, 'Hotel', null, 'Drop Off', null, 'Return drop off at your hotel');

-- Additional trips from client inventory
insert into public.private_trips (
  id, name, slug, destination, short_description, duration, trip_type,
  featured_image_url, status, pickup_point, display_order
) values
  (
    'a1b2c3d4-0001-4000-8000-000000000003',
    'Jabal Thawr Experience',
    'jabal-thawr-experience',
    'Makkah',
    'A guided visit to Jabal Thawr.',
    '1.5 – 2 hrs',
    'Private Sightseeing',
    '/trips/PRIVATE-TRIP-MAKKAH-CARD.png',
    'published',
    'hotel_lobby',
    3
  ),
  (
    'a1b2c3d4-0001-4000-8000-000000000004',
    'Arafat Ziyarah',
    'arafat-ziyarah',
    'Makkah',
    'Visit the plains of Arafat.',
    '1 – 1.5 hrs',
    'Private Sightseeing',
    '/trips/PRIVATE-TRIP-MAKKAH-CARD.png',
    'draft',
    'hotel_lobby',
    4
  ),
  (
    'a1b2c3d4-0001-4000-8000-000000000005',
    'Masjid Quba & Surroundings',
    'masjid-quba-surroundings',
    'Madinah',
    'Discover Masjid Quba and nearby sites.',
    '2 hrs',
    'Private Sightseeing',
    '/trips/PRIVATE-TRIP-MADINAH-CARD.png',
    'published',
    'hotel_lobby',
    5
  ),
  (
    'a1b2c3d4-0001-4000-8000-000000000006',
    'Historical Madinah Tour',
    'historical-madinah-tour',
    'Madinah',
    'Explore the rich history of Madinah.',
    '2 – 3 hrs',
    'Private Sightseeing',
    '/trips/PRIVATE-TRIP-MADINAH-CARD.png',
    'draft',
    'hotel_lobby',
    6
  ),
  (
    'a1b2c3d4-0001-4000-8000-000000000007',
    'Jabal Al Nour (Cave Hira)',
    'jabal-al-nour-cave-hira',
    'Makkah',
    'Visit the Cave Hira.',
    '2 – 2.5 hrs',
    'Private Sightseeing',
    '/trips/PRIVATE-TRIP-MAKKAH-CARD.png',
    'published',
    'hotel_lobby',
    7
  ),
  (
    'a1b2c3d4-0001-4000-8000-000000000008',
    'Taif Day Trip',
    'taif-day-trip',
    'Other',
    'A refreshing trip to Taif.',
    '4 – 6 hrs',
    'Private Sightseeing',
    '/trips/DESTINATION IMAGE.png',
    'published',
    'hotel_lobby',
    8
  )
on conflict (slug) do update set
  name = excluded.name,
  destination = excluded.destination,
  short_description = excluded.short_description,
  duration = excluded.duration,
  status = excluded.status;
