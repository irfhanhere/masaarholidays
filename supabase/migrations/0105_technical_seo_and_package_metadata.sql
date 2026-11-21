-- Migration: 0105_technical_seo_and_package_metadata.sql
-- Additive extension for Technical SEO, Structured Data controls, Robots directives, and OpenGraph metadata.

-- 1. Extend premium_umrah_packages with granular SEO and schema fields
alter table if exists public.premium_umrah_packages
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists noindex boolean not null default false,
  add column if not exists nofollow boolean not null default false,
  add column if not exists schema_enabled boolean not null default true,
  add column if not exists breadcrumb_title text;

-- 2. Update existing authoritative records with audited, compliant metadata

-- Masaar Best Selling Umrah Package
update public.premium_umrah_packages
set
  seo_title = 'Best Selling Umrah Package from UAE | 6 Days & 5 Nights | Masaar Holidays',
  meta_description = 'Explore Masaar''s 6-day, 5-night Umrah package from the UAE with 3 nights in Makkah, 2 nights in Madinah, hotel accommodation, flights and travel assistance. Enquire on WhatsApp.',
  canonical_url = 'https://www.masaarholidays.com/umrah/masaar-best-selling-umrah',
  og_title = 'Best Selling Umrah Package from UAE | 6 Days & 5 Nights | Masaar Holidays',
  og_description = 'Explore Masaar''s 6-day, 5-night Umrah package from the UAE with 3 nights in Makkah, 2 nights in Madinah, hotel accommodation, flights and travel assistance. Enquire on WhatsApp.',
  noindex = false,
  nofollow = false,
  schema_enabled = true,
  breadcrumb_title = 'Masaar Best Selling Umrah Package',
  updated_at = now()
where slug = 'masaar-best-selling-umrah';

-- Masaar Premium Umrah Package
update public.premium_umrah_packages
set
  seo_title = 'Premium Umrah Package from UAE | 6 Days & 5 Nights | Masaar Holidays',
  meta_description = 'Explore Masaar Holidays'' 6-day, 5-night Premium Umrah package from the UAE, featuring accommodation in Makkah and Madinah, Saudi Airlines flights, Haramain Speed Train and guided Ziyarah.',
  canonical_url = 'https://www.masaarholidays.com/umrah/masaar-premium-umrah',
  og_title = 'Premium Umrah Package from UAE | 6 Days & 5 Nights | Masaar Holidays',
  og_description = 'Explore Masaar Holidays'' 6-day, 5-night Premium Umrah package from the UAE, featuring accommodation in Makkah and Madinah, Saudi Airlines flights, Haramain Speed Train and guided Ziyarah.',
  noindex = false,
  nofollow = false,
  schema_enabled = true,
  breadcrumb_title = 'Masaar Premium Umrah Package',
  updated_at = now()
where slug = 'masaar-premium-umrah';

-- 3. Update page_seo for /umrah landing page
update public.page_seo
set
  meta_title = 'Umrah Packages from UAE | Makkah & Madinah Packages | Masaar Holidays',
  meta_description = 'Explore thoughtfully planned Umrah packages from the UAE with Makkah and Madinah accommodation, flights, transfers and travel assistance. Find the right journey with Masaar Holidays.',
  updated_at = now()
where path = '/umrah';
