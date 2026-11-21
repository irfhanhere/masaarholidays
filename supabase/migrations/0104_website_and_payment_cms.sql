-- Migration: 0104_website_and_payment_cms.sql
-- Additive extension for Admin CMS Website Management, Homepage Section Controls, and Payment Display Settings.

-- 1. Extend premium_umrah_packages with optional metadata columns
alter table if exists public.premium_umrah_packages
  add column if not exists package_badge text default 'BEST SELLING',
  add column if not exists departure_country text default 'UAE',
  add column if not exists currency text default 'AED',
  add column if not exists category text default 'Umrah',
  add column if not exists social_image text,
  add column if not exists media_gallery jsonb not null default '[]'::jsonb;

-- 2. Create homepage_cms table for managing homepage sections dynamically
create table if not exists public.homepage_cms (
  id smallint primary key default 1,
  tamara_enabled boolean not null default true,
  tamara_heading text not null default 'Flexible Payments with Tamara',
  tamara_subtitle text not null default 'Enjoy a convenient payment experience with Tamara. Choose Tamara at checkout when available.',
  tamara_supporting_text text not null default 'Select Tamara at checkout on supported travel services and complete your booking securely.',
  tamara_bg_style text not null default 'default',
  tamara_logo_url text not null default '/brand/tamara-logo.svg',
  tamara_display_order integer not null default 2,
  featured_package_enabled boolean not null default true,
  featured_package_heading text not null default 'Featured Umrah Packages',
  featured_package_slug text not null default 'masaar-premium-umrah',
  best_selling_enabled boolean not null default true,
  best_selling_heading text not null default 'Masaar Best Selling Umrah Package',
  best_selling_description text not null default 'Our most sought-after Umrah journey featuring high-comfort hotels in Makkah and Madinah.',
  best_selling_slug text not null default 'masaar-best-selling-umrah',
  explore_more_enabled boolean not null default true,
  explore_more_heading text not null default 'Explore More Umrah Packages',
  explore_more_description text not null default 'Discover thoughtfully planned Umrah journeys designed around your comfort, accommodation preferences and travel needs.',
  explore_more_button_label text not null default 'Explore All Umrah Packages',
  explore_more_button_url text not null default '/umrah',
  section_order jsonb not null default '["hero","tamara","featured_umrah","explore_more","why_masaar","additional_services","private_trips","testimonials","cta"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_cms_singleton check (id = 1)
);

-- Trigger for homepage_cms updated_at
drop trigger if exists homepage_cms_set_updated_at on public.homepage_cms;
create trigger homepage_cms_set_updated_at
  before update on public.homepage_cms
  for each row execute function public.set_updated_at();

-- RLS Policies for homepage_cms
alter table public.homepage_cms enable row level security;

create policy "homepage_cms_public_read" on public.homepage_cms
  for select using (true);

create policy "homepage_cms_admin_write" on public.homepage_cms
  for all to authenticated using (true) with check (true);

-- Seed Initial Row for homepage_cms
insert into public.homepage_cms (id) values (1)
on conflict (id) do nothing;


-- 3. Create payment_display_settings table for promotional copy & enquiry routing
create table if not exists public.payment_display_settings (
  id smallint primary key default 1,
  tabby_promo_enabled boolean not null default false,
  tabby_enquiry_message text not null default 'Interested in paying with Tabby? Contact our team on WhatsApp for assistance. Tabby payment integration is currently being updated.',
  tabby_whatsapp_number text not null default '971557329320',
  tamara_promo_enabled boolean not null default true,
  tamara_heading text not null default 'Flexible Payments with Tamara',
  tamara_description text not null default 'Enjoy a convenient payment experience with Tamara. Choose Tamara at checkout when available.',
  tamara_logo_url text not null default '/brand/tamara-logo.svg',
  tamara_display_order integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_display_settings_singleton check (id = 1)
);

-- Trigger for payment_display_settings updated_at
drop trigger if exists payment_display_settings_set_updated_at on public.payment_display_settings;
create trigger payment_display_settings_set_updated_at
  before update on public.payment_display_settings
  for each row execute function public.set_updated_at();

-- RLS Policies for payment_display_settings
alter table public.payment_display_settings enable row level security;

create policy "payment_display_settings_public_read" on public.payment_display_settings
  for select using (true);

create policy "payment_display_settings_admin_write" on public.payment_display_settings
  for all to authenticated using (true) with check (true);

-- Seed Initial Row for payment_display_settings
insert into public.payment_display_settings (id) values (1)
on conflict (id) do nothing;
