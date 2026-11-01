-- Migration: 0097_saudi_visa_settings.sql
-- Configurable Saudi Visa Settings (Approved Nationalities, Validity Rules, Pricing & WhatsApp)
-- Singleton row pattern (id = 1) editable from the Admin panel.

create table if not exists public.saudi_visa_settings (
  id smallint primary key default 1,
  base_price numeric(10,2) not null default 750.00,
  family_discount_percentage numeric(5,2) not null default 5.00,
  family_minimum_applicants integer not null default 3,
  currency text not null default 'AED',
  processing_estimate text not null default 'Approximately 2 Working Days',
  whatsapp_number text not null default '+971 55 732 9320',
  approved_nationalities jsonb not null default '["India", "Pakistan"]'::jsonb,
  validity_requirements jsonb not null default '{"passportMinMonths": 6, "residenceMinMonths": 3, "emiratesIdMinMonths": 3}'::jsonb,
  allow_unknown_nationalities_manual_review boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint saudi_visa_settings_singleton check (id = 1)
);

alter table public.saudi_visa_settings enable row level security;

create policy "saudi_visa_settings_public_read" on public.saudi_visa_settings
  for select using (true);

create policy "saudi_visa_settings_admin_all" on public.saudi_visa_settings
  for all using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

insert into public.saudi_visa_settings (
  id,
  base_price,
  family_discount_percentage,
  family_minimum_applicants,
  currency,
  processing_estimate,
  whatsapp_number,
  approved_nationalities,
  validity_requirements,
  allow_unknown_nationalities_manual_review
)
values (
  1,
  750.00,
  5.00,
  3,
  'AED',
  'Approximately 2 Working Days',
  '+971 55 732 9320',
  '["India", "Pakistan"]'::jsonb,
  '{"passportMinMonths": 6, "residenceMinMonths": 3, "emiratesIdMinMonths": 3}'::jsonb,
  true
)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
