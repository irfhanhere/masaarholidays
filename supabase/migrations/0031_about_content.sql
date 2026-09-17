-- Admin-editable body copy for the About page — same singleton-row
-- pattern already established for visa_landing_content
-- (0024_visa_landing_content.sql) and home_content (0029_home_content.sql).
-- Every paragraph/quote on the page lives here rather than hardcoded in
-- the component, per this task's explicit instruction, so Haseeb can
-- edit wording without a code change.
--
-- The founder-note section is deliberately unsigned by design — see
-- founder_text/founder_signoff comments below. This is a standing site
-- rule (already noted in the previous, simpler version of this page:
-- "no founder name, no personal photo, anywhere on the site").
create table public.about_content (
  id smallint primary key default 1,

  hero_subline text,

  purpose_text text, -- paragraphs separated by a blank line
  purpose_quote text,
  purpose_image_url text,

  vision_text text,
  mission_text text,

  -- jsonb array of {icon_key, label, description} — the 6-item "Our
  -- Values" grid (Honesty/Care/Responsibility/Good Service/Halal/Giving
  -- Back in the reference, but editable rather than fixed).
  core_values jsonb not null default '[]'::jsonb,

  sadaqah_text text,
  sadaqah_image_url text,

  approach_text text,
  approach_quote text,

  who_we_serve_text text,
  -- jsonb array of {icon_key, label, description} — the 4-item "What
  -- Makes Masaar Different" grid.
  differentiators jsonb not null default '[]'::jsonb,

  founder_eyebrow text, -- e.g. "Our Commitment" — never "A Note from the Founder"
  -- Paragraphs separated by a blank line. Written in first-person
  -- institutional voice ("we"), never naming or implying one specific
  -- individual — enforced by convention here (there is no name/title
  -- column to fill in), not by a runtime check.
  founder_text text,
  founder_image_url text,
  founder_quote text,
  -- e.g. "With sincere regards,\nThe Masaar Holidays Team" — a role/team
  -- signature only, never a personal name.
  founder_signoff text,

  updated_at timestamptz not null default now(),
  constraint about_content_singleton check (id = 1)
);

create trigger about_content_set_updated_at
  before update on public.about_content
  for each row execute function public.set_updated_at();

alter table public.about_content enable row level security;

create policy "about_content_public_read" on public.about_content
  for select using (true);
create policy "about_content_admin_write" on public.about_content
  for all to authenticated using (true) with check (true);

insert into public.about_content (id) values (1) on conflict (id) do nothing;
