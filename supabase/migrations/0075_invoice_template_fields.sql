-- Migration: 0075_invoice_template_fields.sql
-- Phase 3 (Invoice Maker). The invoice reference design needs company
-- banking details, a closing blessing note, a signature block and a
-- footer photo banner that the Quotation template doesn't use — added as
-- nullable columns on the existing document_templates table (all optional,
-- so every other document type is unaffected) rather than a new table,
-- since these are still just template-level branding fields.
--
-- Apply manually in Supabase SQL Editor, after 0074.

alter table public.document_templates
  add column if not exists bank_name text,
  add column if not exists bank_account_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_iban text,
  add column if not exists bank_swift_code text,
  add column if not exists blessing_note text,
  add column if not exists signature_name text,
  add column if not exists signature_title text,
  add column if not exists footer_image_url text;

comment on column public.document_templates.blessing_note is
  'Short closing note shown in a soft callout box near the totals, e.g. "May your journey be accepted and filled with ease. JazakAllahu Khairan" — optional, hidden when empty.';
comment on column public.document_templates.footer_image_url is
  'Full-width photo banner shown at the bottom of the printed/PDF document (e.g. a Kaaba/Masjid al-Haram photo) — optional, hidden when empty.';

update public.document_templates set
  bank_name = 'Emirates NBD',
  bank_account_name = 'Masaar Travel & Tourism L.L.C',
  bank_account_number = '123 456 789 012',
  bank_iban = 'AE12 0260 0012 3456 7890 123',
  bank_swift_code = 'EBILAEAD',
  blessing_note = 'May your journey be accepted and filled with ease. JazakAllahu Khairan',
  signature_name = 'Haseeb Mohammed',
  signature_title = 'Head of Umrah Services',
  footer_image_url = '/trips/PRIVATE-TRIP-MAKKAH-HERO.png',
  company_address = 'Al Zahia, Sharjah, United Arab Emirates'
where document_type = 'invoice';
