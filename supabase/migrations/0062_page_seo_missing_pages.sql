-- Migration: 0062_page_seo_missing_pages.sql
-- 0033_page_seo.sql seeded 8 static pages, but /private-trips, /faq and
-- /blog were built afterwards and never got a page_seo row — so they
-- weren't editable from Admin → Page SEO even though every other static
-- page is. This adds them, using the same copy each page already
-- hardcodes as its fallback (so nothing visibly changes until an admin
-- edits it).
--
-- Apply manually in Supabase SQL Editor.

insert into public.page_seo (path, meta_title, meta_description) values
  ('/private-trips', 'Private Trips in Makkah & Madinah | Masaar Holidays',
    'Explore meaningful, private sightseeing journeys around Makkah and Madinah with your own vehicle, driver and pace.'),
  ('/faq', 'Frequently Asked Questions | Masaar Holidays',
    'Find answers to common questions about Umrah, Hajj, hotels, transfers, visas, and planning your family journey with Masaar Holidays.'),
  ('/blog', 'Masaar Journal — Umrah & Hajj Travel Guides',
    'Practical, honest guides for Umrah and Hajj travel — preparation, packing, family planning, and what to expect in Makkah and Madinah.')
on conflict (path) do nothing;
