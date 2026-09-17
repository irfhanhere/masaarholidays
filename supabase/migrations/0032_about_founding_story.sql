-- Adds the "Founding Story" section fields to about_content
-- (0031_about_content.sql) — same admin-editable-singleton pattern as
-- every other section on the page. Sits between Our Purpose and Our
-- Vision & Mission.
--
-- Written third-person institutional voice, zero first-person language,
-- zero named individual — same standing site rule already enforced for
-- the Commitment section (founder_text/founder_signoff). No name/title
-- column exists here either, by the same convention.
alter table public.about_content
  add column if not exists founding_story_heading text,
  add column if not exists founding_story_text text, -- paragraphs separated by a blank line
  add column if not exists founding_story_image_url text;
