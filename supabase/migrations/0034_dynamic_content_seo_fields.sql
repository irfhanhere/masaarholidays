-- Admin-editable meta title/description directly on each dynamic content
-- table, rather than a second SEO table to keep in sync — same pattern
-- as short_description/maktab_category earlier. Each detail page's
-- generateMetadata prefers these when set, falling back to the same
-- computed-from-content title/description it already generates when
-- they're empty, so nothing goes blank.
alter table public.packages
  add column if not exists meta_title text,
  add column if not exists meta_description text;

alter table public.hotels
  add column if not exists meta_title text,
  add column if not exists meta_description text;

alter table public.visa_types
  add column if not exists meta_title text,
  add column if not exists meta_description text;

alter table public.umrah_departure_months
  add column if not exists meta_title text,
  add column if not exists meta_description text;

comment on column public.packages.meta_title is
  'Admin override for this package''s <title>. Falls back to "{title} | Masaar Holidays" when unset.';
comment on column public.hotels.meta_title is
  'Admin override for this hotel''s <title>. Falls back to "{name} | Masaar Holidays" when unset.';
comment on column public.visa_types.meta_title is
  'Admin override for this visa type''s <title>. Falls back to "{name} | Masaar Holidays" when unset.';
comment on column public.umrah_departure_months.meta_title is
  'Admin override for this departure month''s <title>. Falls back to a generated "Umrah Packages — {label} | Masaar Holidays" when unset.';
