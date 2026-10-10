-- 0083_transfers_module_enhancements.sql
-- Comprehensive schema extensions for Transfers CMS, Vehicle fleet, and Rate Card.

-- 1. Extend transfers table
alter table public.transfers
  add column if not exists pickup_location text,
  add column if not exists dropoff_location text,
  add column if not exists route_type text default 'one-way',
  add column if not exists long_description text,
  add column if not exists duration text,
  add column if not exists route_notes text,
  add column if not exists gallery_images text[] default '{}',
  add column if not exists featured boolean default false,
  add column if not exists seo_title text,
  add column if not exists meta_description text,
  add column if not exists focus_keyword text,
  add column if not exists canonical_url_override text;

-- 2. Extend transfer_vehicles table
alter table public.transfer_vehicles
  add column if not exists slug text,
  add column if not exists vehicle_type text default 'sedan',
  add column if not exists model_year text default '2023 – 2026',
  add column if not exists description text,
  add column if not exists detailed_description text,
  add column if not exists image_url text,
  add column if not exists passenger_capacity integer default 4,
  add column if not exists luggage_capacity integer default 2,
  add column if not exists features text[] default '{}',
  add column if not exists spec_verified boolean default true,
  add column if not exists internal_notes text;

-- 3. Allow public read of active transfer route rates so customers see configured indicative prices
create policy "transfer_route_rates_public_read" on public.transfer_route_rates
  for select using (is_active);

-- 4. Seed/Update vehicle fleet with approved public assets and specifications
update public.transfer_vehicles
set
  slug = 'toyota-camry',
  vehicle_type = 'sedan',
  model_year = '2023 – 2026',
  image_url = '/vehicles/TOYOTA CAMERY.webp',
  passenger_capacity = 3,
  luggage_capacity = 3,
  description = 'Comfortable sedan, ideal for small families and couples.',
  detailed_description = 'Our Toyota Camry fleet provides smooth, quiet, and air-conditioned travel for couples and small families. Suitable for up to 3 passengers with 3 medium-sized suitcases.',
  features = array['Comfortable sedan', 'Ideal for small families', 'Air-conditioned', 'Professional driver'],
  spec_verified = true,
  display_order = 1
where name = 'Toyota Camry';

update public.transfer_vehicles
set
  slug = 'hyundai-staria',
  vehicle_type = 'mpv',
  model_year = '2023 – 2026',
  image_url = '/vehicles/Hyundai Staria.webp',
  passenger_capacity = 7,
  luggage_capacity = 7,
  description = 'Modern and spacious MPV, ideal for families and small groups.',
  detailed_description = 'The futuristic Hyundai Staria features generous cabin space, wide panoramic windows, and comfortable seating for up to 7 passengers with luggage.',
  features = array['Modern & spacious MPV', 'Ideal for families', 'Smooth highway ride', 'Professional driver'],
  spec_verified = true,
  display_order = 2
where name = 'Hyundai Staria';

update public.transfer_vehicles
set
  slug = 'gmc-xl-yukon',
  vehicle_type = 'suv',
  model_year = '2023 – 2026',
  image_url = '/vehicles/gmc-yukon-suburban.webp',
  passenger_capacity = 6,
  luggage_capacity = 6,
  description = 'Spacious and luxurious SUV, ideal for families seeking extra comfort.',
  detailed_description = 'Our flagship GMC Yukon XL provides premium luxury leather seating, generous legroom, and unmatched comfort across long highway routes between Makkah and Madinah.',
  features = array['Luxury VIP SUV', 'Premium leather seating', 'Spacious luggage compartment', 'VIP comfort'],
  spec_verified = true,
  display_order = 3
where name = 'GMC XL Yukon';

update public.transfer_vehicles
set
  slug = 'hiace-grand-cabin',
  vehicle_type = 'van',
  model_year = '2023 – 2026',
  image_url = '/vehicles/Toyota Hiace Grand Cabin.webp',
  passenger_capacity = 12,
  luggage_capacity = 12,
  description = 'Extra space and comfort, ideal for larger groups and extended families.',
  detailed_description = 'The Toyota Hiace Grand Cabin high-roof van delivers spacious headroom, individual passenger seating, and dedicated luggage space for groups of up to 12.',
  features = array['High-roof cabin', 'Large group capacity', 'Ample luggage space', 'Smooth highway ride'],
  spec_verified = true,
  display_order = 4
where name = 'Hiace Grand Cabin';

update public.transfer_vehicles
set
  slug = 'toyota-coaster',
  vehicle_type = 'minibus',
  model_year = '2023 – 2026',
  image_url = '/vehicles/Toyota Coaster.webp',
  passenger_capacity = 24,
  luggage_capacity = 24,
  description = 'Ideal for large groups, Umrah delegations, and corporate travel.',
  detailed_description = 'The Toyota Coaster minibus is built for group pilgrimage travel with 24 passenger seats, high-capacity air conditioning, and a dedicated luggage compartment.',
  features = array['24-seater minibus', 'High-capacity A/C', 'Group delegation transport', 'Experienced driver'],
  spec_verified = true,
  display_order = 5
where name = 'Toyota Coaster';

-- 5. Update transfers routes with local assets and rich metadata
update public.transfers
set
  image_url = '/trips/private-transfers-card-home.webp',
  pickup_location = 'King Abdulaziz International Airport (JED) Arrivals',
  dropoff_location = 'Makkah Hotel (Haram / Aziziyah)',
  route_type = 'one-way',
  duration = '1.5 to 2 hours',
  description = 'Private transfer from King Abdulaziz International Airport (JED) to your hotel in Makkah, with meet & greet and luggage assistance.',
  long_description = 'Begin your Umrah pilgrimage with absolute peace of mind. Our experienced chauffeur will meet you in the airport arrivals terminal with a personalized name board, assist with your luggage, and drive you smoothly to your hotel in Makkah in a private, air-conditioned vehicle.',
  route_notes = 'Meet & greet inside the arrivals terminal. Flight arrival times are monitored automatically for delays. Complimentary waiting time included.',
  featured = true,
  seo_title = 'Jeddah Airport to Makkah Hotel Transfer | Masaar Holidays',
  meta_description = 'Book private transfer from Jeddah Airport to your Makkah hotel. Modern fleet, punctual drivers, and meet & greet service. Enquire on WhatsApp today.',
  focus_keyword = 'Jeddah Airport to Makkah hotel transfer'
where slug = 'jeddah-airport-to-makkah-hotel';

update public.transfers
set
  image_url = '/trips/Makkah Hotel → Jeddah Airport.webp',
  pickup_location = 'Makkah Hotel Lobby',
  dropoff_location = 'King Abdulaziz International Airport (JED) Departures',
  route_type = 'one-way',
  duration = '1.5 to 2 hours',
  description = 'Comfortable and timely transfer from your Makkah hotel to Jeddah Airport, scheduled seamlessly for your flight departure.',
  long_description = 'Ensure a tranquil and punctual conclusion to your Umrah journey. We pick you up directly from your Makkah hotel lobby and transfer you to King Abdulaziz International Airport with ample time for check-in and luggage procedures.',
  route_notes = 'We recommend scheduling pickup at least 4 to 5 hours prior to international flights to ensure a relaxed check-in.',
  featured = false,
  seo_title = 'Makkah Hotel to Jeddah Airport Transfer | Masaar Holidays',
  meta_description = 'Reliable private transfer from your Makkah hotel to Jeddah Airport. Punctual departures with professional drivers and luggage care. Enquire now.',
  focus_keyword = 'Makkah hotel to Jeddah Airport transfer'
where slug = 'makkah-hotel-to-jeddah-airport';

update public.transfers
set
  image_url = '/trips/Jeddah Airport → Madinah Hotel.webp',
  pickup_location = 'King Abdulaziz International Airport (JED) Arrivals',
  dropoff_location = 'Madinah Hotel (Markaziyah / Haram)',
  route_type = 'one-way',
  duration = '4 to 4.5 hours',
  description = 'Direct private highway transfer from Jeddah Airport to your hotel in Madinah via the modern express highway.',
  long_description = 'Travel directly from King Abdulaziz International Airport to the City of the Prophet in complete comfort. Avoid public transit hassle with a private vehicle and professional highway driver.',
  route_notes = 'Clean, air-conditioned highway vehicles with a dedicated stopover at a highway rest station for prayer and refreshments.',
  featured = false,
  seo_title = 'Jeddah Airport to Madinah Hotel Transfer | Masaar Holidays',
  meta_description = 'Private highway transfer from Jeddah Airport directly to Madinah hotel. Modern air-conditioned fleet with luggage assistance. Enquire via WhatsApp.',
  focus_keyword = 'Jeddah Airport to Madinah transfer'
where slug = 'jeddah-airport-to-madinah-hotel';

update public.transfers
set
  image_url = '/trips/Madinah Hotel → Jeddah Airport.webp',
  pickup_location = 'Madinah Hotel Lobby',
  dropoff_location = 'King Abdulaziz International Airport (JED) Departures',
  route_type = 'one-way',
  duration = '4 to 4.5 hours',
  description = 'Direct transfer from your Madinah hotel to Jeddah Airport for your return or onward international flight.',
  long_description = 'Smooth highway transfer from Madinah to Jeddah Airport departures. Punctual pickup, experienced driver, and luggage assistance throughout the journey.',
  route_notes = 'Please schedule departure 6 to 7 hours before international flight departure times.',
  featured = false,
  seo_title = 'Madinah Hotel to Jeddah Airport Transfer | Masaar Holidays',
  meta_description = 'Private intercity transfer from Madinah hotel to Jeddah Airport departures. Punctual, safe, and comfortable highway travel with Masaar.',
  focus_keyword = 'Madinah to Jeddah transfer'
where slug = 'madinah-hotel-to-jeddah-airport';

update public.transfers
set
  image_url = '/trips/Madinah Airport → Madinah Hotel.webp',
  pickup_location = 'Prince Mohammad Bin Abdulaziz Airport (MED) Arrivals',
  dropoff_location = 'Madinah Hotel (Central Area / Markaziyah)',
  route_type = 'one-way',
  duration = '25 to 35 minutes',
  description = 'Quick and comfortable transfer from Madinah Airport directly to your hotel near the Prophet''s Mosque.',
  long_description = 'Arrive in Madinah Al-Munawwarah with ease. Your driver awaits you outside arrivals to transport you and your family directly to your hotel courtyard.',
  route_notes = 'Short, prompt journey with direct curbside or hotel lobby drop-off in the Markaziyah area.',
  featured = true,
  seo_title = 'Madinah Airport to Madinah Hotel Transfer | Masaar Holidays',
  meta_description = 'Private transfer from Madinah Airport to your hotel near the Prophet''s Mosque. Punctual meet & greet service with luggage help. Enquire today.',
  focus_keyword = 'Madinah Airport to hotel transfer'
where slug = 'madinah-airport-to-madinah-hotel';

update public.transfers
set
  image_url = '/trips/Madinah Hotel → Madinah Airport.webp',
  pickup_location = 'Madinah Hotel Lobby',
  dropoff_location = 'Prince Mohammad Bin Abdulaziz Airport (MED) Departures',
  route_type = 'one-way',
  duration = '25 to 35 minutes',
  description = 'Prompt pickup from your Madinah hotel to Madinah Airport for a peaceful conclusion to your visit.',
  long_description = 'Reliable hotel-to-airport transfer service in Madinah. Punctual pickup from your hotel lobby with complete luggage assistance.',
  route_notes = 'Recommended pickup time is 3 hours before your scheduled flight departure.',
  featured = false,
  seo_title = 'Madinah Hotel to Madinah Airport Transfer | Masaar Holidays',
  meta_description = 'Convenient hotel-to-airport transfer in Madinah. Punctual pickups and courteous drivers to ensure a smooth departure. Enquire on WhatsApp.',
  focus_keyword = 'Madinah hotel to Madinah Airport transfer'
where slug = 'madinah-hotel-to-madinah-airport';

update public.transfers
set
  image_url = '/trips/Makkah Hotel ↔ Madinah Hotel.webp',
  pickup_location = 'Makkah Hotel Lobby (or Madinah Hotel)',
  dropoff_location = 'Madinah Hotel Lobby (or Makkah Hotel)',
  route_type = 'one-way',
  duration = '4.5 to 5 hours',
  description = 'Direct intercity transfer between Makkah and Madinah hotels. Private, door-to-door journey at your preferred schedule.',
  long_description = 'Travel between the Two Holy Mosques in complete comfort and privacy. Choose your departure time and travel door-to-door without train station luggage transfers.',
  route_notes = 'Operates in either direction. Refreshment and prayer stops available along the expressway at well-equipped service stations.',
  featured = true,
  seo_title = 'Makkah to Madinah Private Transfer | Masaar Holidays',
  meta_description = 'Private door-to-door transfer between Makkah and Madinah hotels. Travel comfortably at your own schedule with verified drivers. Enquire on WhatsApp.',
  focus_keyword = 'Makkah to Madinah private transfer'
where slug = 'makkah-hotel-to-madinah-hotel';

update public.transfers
set
  image_url = '/trips/Makkah ↔ Madinah via Badr Rawdah Well.webp',
  pickup_location = 'Makkah Hotel Lobby',
  dropoff_location = 'Madinah Hotel Lobby',
  route_type = 'one-way',
  duration = '6 to 7 hours',
  description = 'Intercity journey from Makkah to Madinah with historical stopovers at the battlefield of Badr and Bir Rawha well.',
  long_description = 'Enrich your intercity transfer with a spiritual and historical pilgrimage. Visit the historic battlefield of Badr, the martyrs cemetery, and the blessed well of Bir Rawha along the ancient route.',
  route_notes = 'Includes 1 to 1.5 hours allocated for ziyarat stops at Badr. Courteous driver familiar with the historic sites.',
  featured = false,
  seo_title = 'Makkah to Madinah Transfer via Badr | Masaar Holidays',
  meta_description = 'Private transfer between Makkah and Madinah with historic spiritual stopovers at Badr and Bir Rawha. Enquire via WhatsApp for availability.',
  focus_keyword = 'Makkah to Madinah transfer via Badr'
where slug = 'makkah-hotel-to-madinah-hotel-via-badr';

update public.transfers
set
  image_url = '/trips/MAKKAH MADHIN - HOTEL.webp',
  pickup_location = 'Hotel Lobby (Makkah or Madinah)',
  dropoff_location = 'Hotel Lobby (Return)',
  route_type = 'round-trip',
  duration = '3 to 4 hours',
  description = 'Private Ziyarat tour visiting significant Islamic heritage sites in Makkah or Madinah with experienced drivers.',
  long_description = 'Explore the blessed historical sites of Makkah (Jabal Al-Noor, Jabal Thawr, Mina, Arafat) or Madinah (Mount Uhud, Masjid Quba, Masjid Al-Qiblatayn) in a private air-conditioned vehicle at your own pace.',
  route_notes = 'Flexible stops at each site for reflection and prayer. Available morning or afternoon.',
  featured = false,
  seo_title = 'Makkah and Madinah Ziyarat Transport | Masaar Holidays',
  meta_description = 'Private Ziyarat transport in Makkah and Madinah with experienced drivers. Visit historical Islamic sites in comfort. Enquire on WhatsApp.',
  focus_keyword = 'Makkah and Madinah Ziyarat transport'
where slug = 'makkah-madinah-ziyarat';

update public.transfers
set
  image_url = '/trips/Makkah  Madinah ↔ Train Station.webp',
  pickup_location = 'Hotel or Haramain Train Station',
  dropoff_location = 'Haramain Train Station or Hotel',
  route_type = 'one-way',
  duration = '20 to 35 minutes',
  description = 'Smooth connection between your hotel and the Haramain High Speed Train stations in Makkah, Madinah, or Jeddah.',
  long_description = 'Seamless connection to and from the high-speed rail network. Your driver assists with heavy luggage from your hotel lobby right to the train station passenger entrance.',
  route_notes = 'Punctual pickup scheduled around your exact train departure time to avoid unnecessary waiting.',
  featured = false,
  seo_title = 'Haramain Train Station Transfers | Masaar Holidays',
  meta_description = 'Private transfers between hotels and Haramain High Speed Railway stations in Makkah and Madinah. Punctual, seamless service with luggage assistance.',
  focus_keyword = 'Haramain train station transfers'
where slug = 'makkah-madinah-train-station';

update public.transfers
set
  image_url = '/trips/Jeddah → Taif → Return.webp',
  pickup_location = 'Jeddah Hotel / Residence',
  dropoff_location = 'Taif Sightseeing & Return to Jeddah',
  route_type = 'round-trip',
  duration = '8 to 10 hours',
  description = 'Full-day private excursion from Jeddah to the mountain city of Taif via scenic Al Hada pass, returning the same evening.',
  long_description = 'Experience the cool mountain climate, historic rose water distilleries, and magnificent views of Taif with a dedicated private chauffeur for the full day.',
  route_notes = 'Full-day private chauffeur service with flexible itinerary including Al Hada mountain pass and Taif city center.',
  featured = true,
  seo_title = 'Jeddah to Taif Private Day Trip & Transfer | Masaar Holidays',
  meta_description = 'Explore Taif from Jeddah with a private full-day chauffeur transfer. Experience Al Hada mountain pass and return in comfort. Enquire now.',
  focus_keyword = 'Jeddah to Taif transfer'
where slug = 'jeddah-taif-return';

update public.transfers
set
  image_url = '/trips/Makkah → Taif → Return.webp',
  pickup_location = 'Makkah Hotel Lobby',
  dropoff_location = 'Taif Sightseeing & Return to Makkah',
  route_type = 'round-trip',
  duration = '7 to 9 hours',
  description = 'Scenic day excursion from Makkah to the cool mountain heights of Taif, visiting historic mosques and scenic viewpoints.',
  long_description = 'Escape the desert heat with a refreshing private day journey from Makkah up the Al Hada mountains to historic Taif, returning comfortably before evening.',
  route_notes = 'Includes scenic mountain drive, visit to fruit markets and rose farms, returning directly to your Makkah hotel.',
  featured = false,
  seo_title = 'Makkah to Taif Private Transfer & Tour | Masaar Holidays',
  meta_description = 'Private day trip from Makkah to Taif. Enjoy cool mountain air, historic sites, and scenic drives with dedicated chauffeur. Enquire on WhatsApp.',
  focus_keyword = 'Makkah to Taif private transfer'
where slug = 'makkah-taif-return';
