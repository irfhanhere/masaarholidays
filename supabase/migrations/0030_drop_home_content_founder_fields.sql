-- 0029_home_content.sql was applied to the live database before this
-- follow-up request to cut the Founder's Note + Vision & Mission section
-- landed — editing 0029's file in place (as its own commit message
-- explains) only changes what a FRESH database would create, not an
-- already-migrated one. This drops the now-unused columns from the live
-- table so it actually matches 0029's edited (post-cut) shape: just
-- id, cta_quote_text, cta_quote_reference, updated_at.
alter table public.home_content
  drop column if exists founder_note_heading,
  drop column if exists founder_note_text,
  drop column if exists founder_note_image_url,
  drop column if exists vision_points,
  drop column if exists mission_points;
