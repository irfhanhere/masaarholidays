-- Migration: 0098_create_additional_services.sql
-- Dedicated Additional Services catalogue for Umrah journeys.

create table if not exists public.additional_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'Other Services',
  price_type text not null default 'on_request' check (price_type in ('on_request', 'fixed', 'from')),
  price_aed numeric(10, 2) null,
  currency text not null default 'AED',
  short_description text not null,
  full_description text null,
  image_url text not null,
  icon text not null default 'users',
  features text[] not null default '{}'::text[],
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('published', 'draft', 'archived')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for updated_at
create trigger additional_services_set_updated_at
  before update on public.additional_services
  for each row execute function public.set_updated_at();

-- RLS Policies
alter table public.additional_services enable row level security;

create policy "additional_services_public_read" on public.additional_services
  for select using (true);

create policy "additional_services_admin_write" on public.additional_services
  for all to authenticated using (true) with check (true);

-- Seed Initial 12 Services
-- 6 Published & Homepage Featured
insert into public.additional_services (
  name, slug, category, price_type, price_aed, short_description, full_description, image_url, icon, features, is_featured, status, display_order
) values
(
  'Umrah Guide',
  'umrah-guide',
  'Spiritual Guidance',
  'on_request',
  null,
  'Dedicated guidance and step-by-step assistance throughout your Umrah rituals.',
  'At Masaar Holidays, we believe every Umrah journey deserves thoughtful guidance, personal attention, and spiritual comfort. Our dedicated Umrah Guide service is designed to help pilgrims experience each stage of their sacred journey with confidence, understanding, and peace of mind.',
  '/services/umrah-guide.webp',
  'users',
  array[
    'Step-by-step ritual assistance (Ihram, Tawaf, Sa''i)',
    'Spiritual knowledge & historical context',
    'Personalised attention for individuals, families & groups',
    'A smooth, dignified, and comfortable experience'
  ],
  true,
  'published',
  1
),
(
  'Wheelchair Assistance',
  'wheelchair-assistance',
  'Mobility Support',
  'on_request',
  null,
  'Comfort and mobility support for elderly and physically challenged pilgrims.',
  'Ensure your elderly or physically challenged family members complete their pilgrimage with absolute dignity, ease, and comfort. Our dedicated wheelchair assistants provide patient, reliable accompaniment across Tawaf, Sa''i, and prayer areas.',
  '/services/wheelchair-assistance.webp',
  'wheelchair',
  array[
    'Dedicated personal attendant throughout rites',
    'Smooth navigation through accessible Haram gates & ramps',
    'Patient pacing tailored to senior pilgrims',
    'Available in both Makkah and Madinah'
  ],
  true,
  'published',
  2
),
(
  'Makkah Ziyarah',
  'makkah-ziyarah',
  'Ziyarah Tours',
  'on_request',
  null,
  'Visit significant places around Makkah, including Jabal Al Nour, Jabal Thawr, Mina, Muzdalifah and Arafat.',
  'Deepen your connection to Islamic history with a curated private tour of Makkah''s most sacred landmarks. Travel in air-conditioned comfort accompanied by a knowledgeable local guide.',
  '/services/makkah-ziyarah.webp',
  'mountain',
  array[
    'Visits to Jabal Al Nour (Cave of Hira) & Jabal Thawr',
    'Guided exploration of Mina, Muzdalifah & Plain of Arafat',
    'Private air-conditioned vehicle with hotel pick-up',
    'Licensed bilingual guide sharing rich historical insights'
  ],
  true,
  'published',
  3
),
(
  'Madinah Ziyarah',
  'madinah-ziyarah',
  'Ziyarah Tours',
  'on_request',
  null,
  'A guided visit to key sites in Madinah, such as Mount Uhud, Masjid Quba and Garden Salman Farsi.',
  'Explore the tranquil history of the Prophet''s City. Visit the first mosque in Islam, honour the martyrs of Uhud, and experience the timeless heritage of Madinah Al-Munawwarah.',
  '/services/madinah-ziyarah.webp',
  'mosque',
  array[
    'Masjid Quba & Mount Uhud (Archers'' Hill)',
    'Masjid Al-Qiblatain & Seven Mosques',
    'Garden of Salman Al-Farsi date palms',
    'Flexible pacing for quiet reflection and prayers'
  ],
  true,
  'published',
  4
),
(
  'Private Transport',
  'private-transport',
  'Transport',
  'from',
  350.00,
  'Convenient and reliable transfers for airports, hotels and intercity travel in Saudi Arabia.',
  'Seamless private chauffeur mobility between Jeddah Airport, Makkah hotels, Madinah hotels, and Haramain high-speed train stations in executive sedans, GMC Yukons, and luxury passenger vans.',
  '/services/private-transport.webp',
  'car',
  array[
    'Flight monitoring and airport meet-and-greet',
    'Spacious vehicles for families and generous luggage',
    'Courteous, licensed professional drivers',
    'Direct door-to-door transfer without waiting'
  ],
  true,
  'published',
  5
),
(
  'Private Tours',
  'private-tours',
  'Ziyarah Tours',
  'on_request',
  null,
  'Personalised tours and cultural experiences in Makkah, Madinah and surrounding areas.',
  'Bespoke historical and cultural journeys tailored completely to your schedule, interests, and family preferences, including trips to Taif, Badar, and hidden heritage sites.',
  '/services/private-tours.webp',
  'map-pin',
  array[
    'Completely customisable itineraries and timing',
    'Visits to Taif rose factories and mountain lookouts',
    'Private luxury vehicle with dedicated concierge',
    'Tailored for families, seniors, and private delegations'
  ],
  true,
  'published',
  6
),
-- 6 Draft / Unpublished Catalogue Services (Ready for admin approval)
(
  'Tour Guide for Sightseeing',
  'tour-guide-sightseeing',
  'Spiritual Guidance',
  'on_request',
  null,
  'Professional licensed tour guides providing deep historical commentary across major Islamic landmarks.',
  'Enrich your pilgrimage with comprehensive scholarly insight into the historical events that unfolded across the Two Holy Sanctuaries.',
  '/brand/banners/umrah.webp',
  'users',
  array['Scholarly commentary', 'Bilingual guides', 'Tailored group sessions'],
  false,
  'draft',
  7
),
(
  'Walking Tour Guide',
  'walking-tour-guide',
  'Spiritual Guidance',
  'on_request',
  null,
  'Intimate walking tours exploring historical mosques and cultural heritage around the holy courtyards.',
  'Experience intimate walking narratives covering the immediate surroundings of Al-Masjid Al-Haram and Al-Masjid An-Nabawi.',
  '/trips/stop-madinah-mount-rumah.webp',
  'map-pin',
  array['Step-free curated routes', 'Hidden historical sites', 'Small private parties'],
  false,
  'draft',
  8
),
(
  'Family Photography',
  'family-photography',
  'Special Assistance',
  'on_request',
  null,
  'Discreet, professional family photography capturing sacred memories outside the mosque perimeters.',
  'Capture timeless family memories in traditional pilgrim attire against picturesque desert, mountain, and city backdrops outside the restricted prayer areas.',
  '/brand/banners/umrah.webp',
  'camera',
  array['High-resolution edited digital gallery', 'Discreet, culturally respectful photographers', 'Flexible family scheduling'],
  false,
  'draft',
  9
),
(
  'Luggage Assistance',
  'luggage-assistance',
  'Special Assistance',
  'on_request',
  null,
  'Dedicated baggage handling and luggage transfer support between hotels and intercity transit points.',
  'Travel light and stress-free while our logistical support team handles baggage loading, intercity transit, and check-in porterage.',
  '/brand/Explore cards/explore-transfers.jpg',
  'luggage',
  array['Door-to-door luggage handling', 'Zamzam water container protection', 'Train station porter coordination'],
  false,
  'draft',
  10
),
(
  'Child Seat',
  'child-seat',
  'Transport',
  'fixed',
  100.00,
  'Certified age-appropriate infant and child safety car seats fitted into private transfer vehicles.',
  'Ensure the safety and comfort of your little ones during long desert highways and intercity transfers between Jeddah, Makkah, and Madinah.',
  '/vehicles/hyundai-staria.webp',
  'baby',
  array['ECE R44/04 compliant seats', 'Pre-installed before airport pickup', 'Sanitised and inspected before every trip'],
  false,
  'draft',
  11
),
(
  'Other Approved Additional Services',
  'other-additional-services',
  'Other Services',
  'on_request',
  null,
  'Custom requests, special accessibility arrangements, and bespoke pilgrimage add-ons.',
  'Have a unique requirement or bespoke arrangement? Masaar Holidays concierge will coordinate directly to accommodate your specific wishes.',
  '/brand/banners/umrah.webp',
  'star',
  array['Dedicated VIP coordinator', 'Custom quotes within 2 hours', 'Bespoke concierge fulfillment'],
  false,
  'draft',
  12
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  price_type = excluded.price_type,
  price_aed = excluded.price_aed,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  image_url = excluded.image_url,
  icon = excluded.icon,
  features = excluded.features,
  is_featured = excluded.is_featured,
  status = excluded.status,
  display_order = excluded.display_order,
  updated_at = now();

