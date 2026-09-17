-- Seeds the 6 visa_types rows (already inserted via DML against the slug/
-- name/description/audience_text columns that existed before this
-- feature) with the new detail-page fields added in
-- 0022_visa_type_detail_pages.sql, plus their per-type "Documents
-- Required" cards.
--
-- Umrah Visa's copy is transcribed from the attached reference mockup
-- (the detailed Umrah Visa page) as closely as legible. The other 5
-- types' headlines are transcribed from the "Visa Section — All 7
-- Screens" overview mockup where legible; their body copy (intro,
-- document descriptions, important-info text) is placeholder pending
-- Haseeb's real per-type content, written to demonstrate the shared
-- template rather than as final marketing copy.
--
-- Run this only after 0022 has been applied (it depends on the columns
-- that migration adds).

update public.visa_types set
  hero_headline = 'Your Journey Starts Here',
  hero_intro = 'We provide expert support to help you obtain your Umrah visa, so you can focus on what truly matters — your spiritual journey.',
  hero_image_url = '/brand/banners/umrah.png',
  features = '[
    {"icon_key": "document", "label": "Guidance at Every Step"},
    {"icon_key": "headset", "label": "Experienced Support Team"},
    {"icon_key": "clock", "label": "Up-to-Date Information"},
    {"icon_key": "heart", "label": "A Smoother Journey"}
  ]'::jsonb,
  documents_intro = 'The following documents are typically required for an Umrah visa application. Requirements may vary based on your nationality.',
  important_info_text = E'Visa requirements, processing times and fees can change frequently and may vary based on your nationality. Please always verify the latest information with the relevant embassy, consulate or authority.\nMasaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.',
  cta_note = 'Our team is available to assist you during working hours.'
where slug = 'umrah';

update public.visa_types set
  hero_headline = 'Travel to the UAE With Clarity',
  hero_intro = 'From entry permits to residency-linked visas, we help you understand what the UAE requires and prepare your application with confidence.',
  hero_image_url = '/brand/banners/default.png',
  features = '[
    {"icon_key": "document", "label": "Guidance at Every Step"},
    {"icon_key": "headset", "label": "Experienced Support Team"},
    {"icon_key": "clock", "label": "Up-to-Date Information"},
    {"icon_key": "heart", "label": "A Smoother Journey"}
  ]'::jsonb,
  documents_intro = 'The documents required may vary depending on your nationality, visa type and current immigration requirements.',
  important_info_text = E'UAE visa requirements, processing times and fees can change frequently and may vary based on your nationality and visa category. Please always verify the latest information with the relevant UAE authority.\nMasaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.',
  cta_note = 'Our team is available to assist you during working hours.'
where slug = 'uae';

update public.visa_types set
  hero_headline = 'Visa Assistance Beyond Borders',
  hero_intro = 'Planning international travel? We help you understand visa requirements for a wide range of destinations and prepare the right documents.',
  hero_image_url = '/brand/banners/default.png',
  features = '[
    {"icon_key": "document", "label": "Guidance at Every Step"},
    {"icon_key": "headset", "label": "Experienced Support Team"},
    {"icon_key": "clock", "label": "Up-to-Date Information"},
    {"icon_key": "heart", "label": "A Smoother Journey"}
  ]'::jsonb,
  documents_intro = 'Requirements vary by destination and nationality — our team will confirm exactly what applies to your trip.',
  important_info_text = E'Visa requirements, processing times and fees vary significantly by destination and can change frequently. Please always verify the latest information with the relevant embassy or consulate.\nMasaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.',
  cta_note = 'Our team is available to assist you during working hours.'
where slug = 'global';

update public.visa_types set
  hero_headline = 'Discover Saudi Arabia With Confidence',
  hero_intro = 'Travelling to Saudi Arabia for tourism, beyond Umrah or Hajj? We help you prepare a smooth, well-documented tourist visa application.',
  hero_image_url = '/brand/banners/default.png',
  features = '[
    {"icon_key": "document", "label": "Guidance at Every Step"},
    {"icon_key": "headset", "label": "Experienced Support Team"},
    {"icon_key": "clock", "label": "Up-to-Date Information"},
    {"icon_key": "heart", "label": "A Smoother Journey"}
  ]'::jsonb,
  documents_intro = 'The following documents are typically required for a Saudi tourist visa. Requirements may vary based on your nationality.',
  important_info_text = E'Saudi tourist visa requirements, processing times and fees can change frequently and may vary based on your nationality. Please always verify the latest information with the relevant authority.\nMasaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.',
  cta_note = 'Our team is available to assist you during working hours.'
where slug = 'saudi-tourist';

update public.visa_types set
  hero_headline = 'Emirates ID Assistance',
  hero_intro = 'Whether you are applying for the first time or renewing, we guide you through the Emirates ID process from start to finish.',
  hero_image_url = '/brand/banners/default.png',
  features = '[
    {"icon_key": "document", "label": "Guidance at Every Step"},
    {"icon_key": "headset", "label": "Experienced Support Team"},
    {"icon_key": "clock", "label": "Up-to-Date Information"},
    {"icon_key": "heart", "label": "A Smoother Journey"}
  ]'::jsonb,
  documents_intro = 'The following documents are typically required for an Emirates ID application or renewal.',
  important_info_text = E'Emirates ID requirements, processing times and fees can change and may vary based on your residency status. Please always verify the latest information with the relevant authority.\nMasaar Holidays facilitates applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.',
  who_needs_this = '["New residents", "Existing residents renewing their Emirates ID", "Applicants requiring related identity-card services"]'::jsonb,
  cta_note = 'Our team is available to assist you during working hours.'
where slug = 'emirates-id';

update public.visa_types set
  hero_headline = 'India Visa Assistance',
  hero_intro = 'Planning a trip to India? We help you understand the visa category you need and prepare your application with the right documents.',
  hero_image_url = '/brand/banners/default.png',
  features = '[
    {"icon_key": "document", "label": "Guidance at Every Step"},
    {"icon_key": "headset", "label": "Experienced Support Team"},
    {"icon_key": "clock", "label": "Up-to-Date Information"},
    {"icon_key": "heart", "label": "A Smoother Journey"}
  ]'::jsonb,
  documents_intro = 'The following documents are typically required for an India visa application. Requirements may vary based on your nationality.',
  important_info_text = E'India visa requirements, processing times and fees can change frequently and may vary based on your nationality. Please always verify the latest information with the relevant embassy, consulate or authority.\nMasaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.',
  cta_note = 'Our team is available to assist you during working hours.'
where slug = 'india';

-- Documents Required cards — Umrah gets the full 8-card set transcribed
-- from the reference mockup; the other 5 types get a shorter, clearly
-- placeholder-appropriate set covering the common core documents, pending
-- real per-type checklists.
with v as (select id from public.visa_types where slug = 'umrah')
insert into public.visa_documents (visa_type_id, title, description, icon_key, display_order)
select v.id, d.title, d.description, d.icon_key, d.display_order
from v, (values
  (0, 'Valid Passport', 'Minimum 6 months validity from intended travel date', 'passport'),
  (1, 'Recent Passport Photo', 'White background, taken within the last 6 months', 'photo'),
  (2, 'Completed Application', 'Filled in accurately and signed', 'document'),
  (3, 'Confirmed Travel Details', 'Flight itinerary showing arrival and departure dates', 'flight'),
  (4, 'Hotel Reservation', 'Confirmed accommodation in Makkah and Madinah', 'hotel'),
  (5, 'Proof of Vaccination', 'As required by current Saudi health regulations', 'shield'),
  (6, 'Additional Documents', 'Any further documents requested for your nationality', 'document'),
  (7, 'For Group Travel', 'Group leader details and traveller list, where applicable', 'group')
) as d(display_order, title, description, icon_key)
on conflict do nothing;

with v as (select id from public.visa_types where slug = 'uae')
insert into public.visa_documents (visa_type_id, title, description, icon_key, display_order)
select v.id, d.title, d.description, d.icon_key, d.display_order
from v, (values
  (0, 'Valid Passport', 'Minimum 6 months validity from intended travel date', 'passport'),
  (1, 'Recent Passport Photo', 'White background, taken within the last 6 months', 'photo'),
  (2, 'Completed Application', 'Filled in accurately and signed', 'document'),
  (3, 'Confirmed Travel Details', 'Flight itinerary showing arrival and departure dates', 'flight')
) as d(display_order, title, description, icon_key)
on conflict do nothing;

with v as (select id from public.visa_types where slug = 'global')
insert into public.visa_documents (visa_type_id, title, description, icon_key, display_order)
select v.id, d.title, d.description, d.icon_key, d.display_order
from v, (values
  (0, 'Valid Passport', 'Minimum 6 months validity from intended travel date', 'passport'),
  (1, 'Recent Passport Photo', 'White background, taken within the last 6 months', 'photo'),
  (2, 'Completed Application', 'Destination-specific application form', 'document'),
  (3, 'Confirmed Travel Details', 'Flight itinerary and, where required, hotel booking', 'flight')
) as d(display_order, title, description, icon_key)
on conflict do nothing;

with v as (select id from public.visa_types where slug = 'saudi-tourist')
insert into public.visa_documents (visa_type_id, title, description, icon_key, display_order)
select v.id, d.title, d.description, d.icon_key, d.display_order
from v, (values
  (0, 'Valid Passport', 'Minimum 6 months validity from intended travel date', 'passport'),
  (1, 'Recent Passport Photo', 'White background, taken within the last 6 months', 'photo'),
  (2, 'Completed Application', 'Filled in accurately and signed', 'document'),
  (3, 'Confirmed Travel Details', 'Flight itinerary showing arrival and departure dates', 'flight'),
  (4, 'Hotel Reservation', 'Confirmed accommodation for the duration of stay', 'hotel')
) as d(display_order, title, description, icon_key)
on conflict do nothing;

with v as (select id from public.visa_types where slug = 'emirates-id')
insert into public.visa_documents (visa_type_id, title, description, icon_key, display_order)
select v.id, d.title, d.description, d.icon_key, d.display_order
from v, (values
  (0, 'Valid Passport', 'Minimum 6 months validity, with valid UAE residence visa page', 'passport'),
  (1, 'Recent Passport Photo', 'White background, taken within the last 6 months', 'photo'),
  (2, 'Completed Application', 'Filled in accurately and signed', 'document'),
  (3, 'Proof of Payment', 'Emirates ID application/renewal fee receipt', 'payment')
) as d(display_order, title, description, icon_key)
on conflict do nothing;

with v as (select id from public.visa_types where slug = 'india')
insert into public.visa_documents (visa_type_id, title, description, icon_key, display_order)
select v.id, d.title, d.description, d.icon_key, d.display_order
from v, (values
  (0, 'Valid Passport', 'Minimum 6 months validity from intended travel date', 'passport'),
  (1, 'Recent Passport Photo', 'White background, taken within the last 6 months', 'photo'),
  (2, 'Completed Application', 'Filled in accurately and signed', 'document'),
  (3, 'Confirmed Travel Details', 'Flight itinerary showing arrival and departure dates', 'flight')
) as d(display_order, title, description, icon_key)
on conflict do nothing;
