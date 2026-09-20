-- Migration: 0056_private_trips_gallery_and_inclusions.sql
-- Adds admin-editable Photo Gallery and What's Included fields to
-- private_trips — both were previously hardcoded/limited on the public
-- detail page (gallery fell back to stop images + fixed asset files;
-- "What's Included" was a fixed 4-item list in page.tsx with no admin
-- control at all).
--
-- Apply manually in Supabase SQL Editor.

alter table public.private_trips
  add column if not exists gallery_images text[] not null default '{}',
  add column if not exists whats_included text[] not null default '{}';

comment on column public.private_trips.gallery_images is
  'Ordered list of image URLs for the detail page Photo Gallery. Falls back to itinerary stop images when empty.';
comment on column public.private_trips.whats_included is
  'Ordered list of "What''s Included" bullet points shown on the detail page. Falls back to a generic default list when empty.';

-- Seed the two existing published trips with their current (previously
-- hardcoded) values, so nothing visibly changes until an admin edits them.
update public.private_trips
set whats_included = array[
  'Private transportation',
  'Experienced driver',
  'Customizable stops (on request)',
  'Flexible timing within the day'
]
where whats_included = '{}';
