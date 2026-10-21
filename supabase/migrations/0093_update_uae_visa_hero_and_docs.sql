-- Migration 0093: Update UAE visa hero image and configure exact 3 document requirements

-- 1. Update UAE visa hero image to the UAE Dubai skyline banner
update public.visa_types
set hero_image_url = '/brand/banners/uae.webp'
where slug = 'uae';

-- 2. Relax NOT NULL constraint on passport_issue_date and place_of_issue in visa_applicants if present
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'visa_applicants'
      and column_name = 'passport_issue_date'
      and is_nullable = 'NO'
  ) then
    alter table public.visa_applicants alter column passport_issue_date drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_name = 'visa_applicants'
      and column_name = 'place_of_issue'
      and is_nullable = 'NO'
  ) then
    alter table public.visa_applicants alter column place_of_issue drop not null;
  end if;
end $$;

-- 3. Replace UAE visa document requirements with only three requirements:
--    1. Passport First Page
--    2. Passport Size Photo
--    3. Passport Address Page
with v as (select id from public.visa_types where slug = 'uae')
delete from public.visa_documents
where visa_type_id in (select id from v);

with v as (select id from public.visa_types where slug = 'uae')
insert into public.visa_documents (visa_type_id, title, description, icon_key, display_order)
select v.id, d.title, d.description, d.icon_key, d.display_order
from v, (values
  (0, 'Passport First Page', 'Clear, coloured copy of the passport bio-data page showing photo, name, and validity.', 'passport'),
  (1, 'Passport Size Photo', 'Recent passport-size photo with white background (within the last 6 months).', 'photo'),
  (2, 'Passport Address Page', 'Clear copy of the passport address page showing residential address details.', 'document')
) as d(display_order, title, description, icon_key);
