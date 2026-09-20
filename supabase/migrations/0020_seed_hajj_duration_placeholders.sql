-- Adds admin slots for the 3 additional Hajj durations shown in the
-- reference layout (9/16/24-night = 10/17/25-day), across all 3 tiers —
-- 9 new rows total. Does NOT touch the 3 existing live Hajj rows
-- (13-night/14-day Essential + Signature, 15-night/16-night Privé).
--
-- Tier-level copy (title, city_destination, inclusions_text,
-- advance_booking_note, flight_note, rate_disclaimer, validity_label,
-- is_featured) is copied verbatim from each tier's existing live row —
-- not new invented marketing copy, just extending the same
-- already-established placeholder text (from 0012's seed) to the new
-- duration siblings, keeping the tier-level sync invariant intact
-- (every duration variant of a tier is supposed to share this copy —
-- see actions.ts#savePackage's sibling-sync update). short_description
-- stays null on every existing Hajj row already, so the new rows match.
--
-- maktab_category and itinerary_segments are left null/empty per
-- instruction — pending Haseeb's real content. All 9 rows seed
-- is_active = false / show_on_website = false: they exist for the admin
-- to fill in later, not to appear on the public site yet.
with tier_copy(tier, title, city_destination, inclusions_text, advance_booking_note, flight_note, rate_disclaimer, validity_label, is_featured) as (
  values
    ('essential'::public.package_tier, 'Essential Hajj', 'Makkah / Madinah',
    E'Comfortable hotel stay\nPrivate shuttle transport\nVisa processing\nAirport transfers',
     'Hajj travel fills up early — recommended to register your interest well ahead of the season.',
     'International flights are not included — we can help arrange these separately on request.',
     'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.',
     'Travel dates arranged directly with your advisor', false),
    ('signature'::public.package_tier, 'Signature Hajj', 'Makkah / Madinah',
    E'Closer hotel, within walking distance to the Haram\nPrivate transport\nVisa processing\nGuided support throughout your journey',
     'Hajj travel fills up early — recommended to register your interest well ahead of the season.',
     'International flights are not included — we can help arrange these separately on request.',
     'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.',
     'Travel dates arranged directly with your advisor', true),
    ('prive'::public.package_tier, 'Privé Hajj', 'Makkah / Madinah',
     E'Premium hotel, closest available proximity to the Haram\nPrivate transport throughout\nVisa processing\nDedicated personal support from start to finish',
     'Hajj travel fills up early, especially at this level — recommended to register your interest as soon as possible.',
     'International flights are not included — we can help arrange these separately on request.',
     'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.',
     'Travel dates arranged directly with your advisor', false)
),
durations(nights, days, label) as (
  values
    (9, 10, '9 Nights / 10 Days'),
    (16, 17, '16 Nights / 17 Days'),
    (24, 25, '24 Nights / 25 Days')
)
insert into public.packages (
  type, tier, title, slug, city_destination, duration_days, duration_nights, duration_label,
  validity_label, inclusions_text, advance_booking_note, flight_note, rate_disclaimer,
  is_featured, is_active, show_on_website, itinerary, itinerary_segments, maktab_category
)
select
  'hajj'::public.package_type,
  tc.tier,
  tc.title,
  'hajj-' || tc.tier::text || '-' || d.days || '-days',
  tc.city_destination,
  d.days,
  d.nights,
  d.label,
  tc.validity_label,
  tc.inclusions_text,
  tc.advance_booking_note,
  tc.flight_note,
  tc.rate_disclaimer,
  tc.is_featured,
  false, -- is_active
  false, -- show_on_website
  '[]'::jsonb,
  '[]'::jsonb,
  null
from tier_copy tc
cross join durations d
on conflict (slug) do nothing;
