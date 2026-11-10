-- Migration: 0100_additional_services_site_integration.sql
-- Integrates Additional Services site-wide: display controls, enquiry popup flags, WhatsApp templates, and FAQs.

-- 1. Extend faq_category enum to support 'additional_services'
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'faq_category' and e.enumlabel = 'additional_services'
  ) then
    alter type faq_category add value 'additional_services';
  end if;
end $$;

-- 2. Add site-wide placement and enquiry control columns to additional_services
alter table public.additional_services
  add column if not exists show_on_homepage boolean not null default true,
  add column if not exists homepage_display_order integer null,
  add column if not exists show_in_thoughtful_services boolean not null default true,
  add column if not exists thoughtful_services_order integer null,
  add column if not exists show_in_enquiry_popup boolean not null default true,
  add column if not exists enquiry_popup_order integer null,
  add column if not exists allow_multiple_in_popup boolean not null default true,
  add column if not exists is_enquiry_enabled boolean not null default true,
  add column if not exists whatsapp_template_key text null,
  add column if not exists faqs jsonb not null default '[]'::jsonb;

-- 3. Synchronize existing records
update public.additional_services
set
  show_on_homepage = is_featured,
  homepage_display_order = display_order,
  show_in_thoughtful_services = case when status = 'published' then true else false end,
  thoughtful_services_order = display_order,
  show_in_enquiry_popup = case when status = 'published' then true else false end,
  enquiry_popup_order = display_order,
  is_enquiry_enabled = true
where homepage_display_order is null;

-- Set default template keys for known services
update public.additional_services set whatsapp_template_key = 'umrah-guide-enquiry' where slug = 'umrah-guide';
update public.additional_services set whatsapp_template_key = 'wheelchair-assistance-enquiry' where slug = 'wheelchair-assistance';
update public.additional_services set whatsapp_template_key = 'makkah-ziyarah-enquiry' where slug = 'makkah-ziyarah';
update public.additional_services set whatsapp_template_key = 'madinah-ziyarah-enquiry' where slug = 'madinah-ziyarah';
update public.additional_services set whatsapp_template_key = 'private-transport-enquiry' where slug = 'private-transport';
update public.additional_services set whatsapp_template_key = 'private-tours-enquiry' where slug = 'private-tours';
update public.additional_services set whatsapp_template_key = 'tour-guide-sightseeing-enquiry' where slug = 'tour-guide-sightseeing';

-- 4. Seed the 6 approved Additional Services Landing Page FAQs
insert into public.faqs (category, question, answer, display_order, published)
values
(
  'additional_services',
  'What additional services does Masaar Holidays offer?',
  'Masaar Holidays provides a range of additional services to help organise your pilgrimage, including Umrah guidance, Ziyarah arrangements, transport and other assistance. Available services depend on the confirmed arrangements.',
  1,
  true
),
(
  'additional_services',
  'Can I book an Umrah Guide separately?',
  'You can enquire about arranging an Umrah Guide separately. Our team will discuss the available arrangements, requirements and availability.',
  2,
  true
),
(
  'additional_services',
  'Can I request Makkah and Madinah Ziyarah?',
  'Yes. You can enquire about Makkah and Madinah Ziyarah arrangements. Private or group options are subject to availability and confirmation.',
  3,
  true
),
(
  'additional_services',
  'Can I add additional services to my Umrah package?',
  'Yes. You can discuss optional services with our team and request that suitable arrangements be included in your quotation.',
  4,
  true
),
(
  'additional_services',
  'How can I enquire about a particular service?',
  'Select the service you are interested in and use its WhatsApp enquiry option. Our team can help you understand the available arrangements.',
  5,
  true
),
(
  'additional_services',
  'Are all services available throughout the year?',
  'Availability depends on the service, travel dates and local arrangements. Please contact our team to confirm availability.',
  6,
  true
)
on conflict do nothing;

