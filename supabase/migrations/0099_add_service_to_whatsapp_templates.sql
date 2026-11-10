-- Migration: 0099_add_service_to_whatsapp_templates.sql
-- Adds service assignment and default CTA text to whatsapp_templates table,
-- and seeds the 7 official Additional Services enquiry templates.

alter table public.whatsapp_templates
  add column if not exists assigned_service_slug text,
  add column if not exists default_cta_text text default 'Enquire on WhatsApp';

-- 1. Umrah Guide enquiry
insert into public.whatsapp_templates (
  key,
  label,
  template_text,
  placeholders,
  is_active,
  display_order,
  assigned_service_slug,
  default_cta_text
) values (
  'umrahGuideEnquiry',
  'Umrah Guide Enquiry',
  'Assalamu Alaikum, Masaar Holidays.' || chr(10) || chr(10) ||
  'I would like to enquire about arranging an Umrah Guide.' || chr(10) || chr(10) ||
  'Name:' || chr(10) ||
  'Travel date:' || chr(10) ||
  'Number of pilgrims:' || chr(10) ||
  'Preferred city: {{city}}' || chr(10) ||
  'Preferred language:' || chr(10) ||
  'Service requirements: {{service_option}}' || chr(10) || chr(10) ||
  'Please share the available arrangements and details.{{package_ref}}{{url_ref}}',
  array['city', 'service_option', 'package_name', 'service_url'],
  true,
  20,
  'umrah-guide',
  'Enquire on WhatsApp'
) on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  assigned_service_slug = excluded.assigned_service_slug,
  default_cta_text = excluded.default_cta_text;

-- 2. Makkah Ziyarah enquiry
insert into public.whatsapp_templates (
  key,
  label,
  template_text,
  placeholders,
  is_active,
  display_order,
  assigned_service_slug,
  default_cta_text
) values (
  'makkahZiyarahEnquiry',
  'Makkah Ziyarah Enquiry',
  'Assalamu Alaikum, Masaar Holidays.' || chr(10) || chr(10) ||
  'I am interested in Makkah Ziyarah arrangements.' || chr(10) || chr(10) ||
  'Name:' || chr(10) ||
  'Travel date:' || chr(10) ||
  'Number of travellers:' || chr(10) ||
  'Preferred arrangement: {{service_option}}' || chr(10) ||
  'Pickup location:' || chr(10) ||
  'Special requirements:' || chr(10) || chr(10) ||
  'Please share the available options and quotation.{{package_ref}}{{url_ref}}',
  array['service_option', 'package_name', 'service_url'],
  true,
  21,
  'makkah-ziyarah',
  'Enquire on WhatsApp'
) on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  assigned_service_slug = excluded.assigned_service_slug,
  default_cta_text = excluded.default_cta_text;

-- 3. Madinah Ziyarah enquiry
insert into public.whatsapp_templates (
  key,
  label,
  template_text,
  placeholders,
  is_active,
  display_order,
  assigned_service_slug,
  default_cta_text
) values (
  'madinahZiyarahEnquiry',
  'Madinah Ziyarah Enquiry',
  'Assalamu Alaikum, Masaar Holidays.' || chr(10) || chr(10) ||
  'I am interested in Madinah Ziyarah arrangements.' || chr(10) || chr(10) ||
  'Name:' || chr(10) ||
  'Travel date:' || chr(10) ||
  'Number of travellers:' || chr(10) ||
  'Preferred arrangement: {{service_option}}' || chr(10) ||
  'Pickup location:' || chr(10) ||
  'Special requirements:' || chr(10) || chr(10) ||
  'Please share the available options and quotation.{{package_ref}}{{url_ref}}',
  array['service_option', 'package_name', 'service_url'],
  true,
  22,
  'madinah-ziyarah',
  'Enquire on WhatsApp'
) on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  assigned_service_slug = excluded.assigned_service_slug,
  default_cta_text = excluded.default_cta_text;

-- 4. Private Tours enquiry
insert into public.whatsapp_templates (
  key,
  label,
  template_text,
  placeholders,
  is_active,
  display_order,
  assigned_service_slug,
  default_cta_text
) values (
  'privateToursEnquiry',
  'Private Tours Enquiry',
  'Assalamu Alaikum, Masaar Holidays.' || chr(10) || chr(10) ||
  'I would like to enquire about a private tour.' || chr(10) || chr(10) ||
  'Name:' || chr(10) ||
  'Travel date:' || chr(10) ||
  'Number of travellers:' || chr(10) ||
  'Preferred destination: {{city}}' || chr(10) ||
  'Preferred duration: {{duration}}' || chr(10) ||
  'Pickup location:' || chr(10) ||
  'Special requests:' || chr(10) || chr(10) ||
  'Please contact me with the available arrangements.{{package_ref}}{{url_ref}}',
  array['city', 'duration', 'package_name', 'service_url'],
  true,
  23,
  'private-tours',
  'Enquire on WhatsApp'
) on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  assigned_service_slug = excluded.assigned_service_slug,
  default_cta_text = excluded.default_cta_text;

-- 5. Wheelchair Assistance enquiry
insert into public.whatsapp_templates (
  key,
  label,
  template_text,
  placeholders,
  is_active,
  display_order,
  assigned_service_slug,
  default_cta_text
) values (
  'wheelchairAssistanceEnquiry',
  'Wheelchair Assistance Enquiry',
  'Assalamu Alaikum, Masaar Holidays.' || chr(10) || chr(10) ||
  'I would like to enquire about wheelchair assistance during my pilgrimage.' || chr(10) || chr(10) ||
  'Name:' || chr(10) ||
  'Travel date:' || chr(10) ||
  'Number of travellers:' || chr(10) ||
  'City required: {{city}}' || chr(10) ||
  'Type of assistance required: {{service_option}}' || chr(10) ||
  'Additional information:' || chr(10) || chr(10) ||
  'Please share the arrangements and availability.{{package_ref}}{{url_ref}}',
  array['city', 'service_option', 'package_name', 'service_url'],
  true,
  24,
  'wheelchair-assistance',
  'Enquire on WhatsApp'
) on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  assigned_service_slug = excluded.assigned_service_slug,
  default_cta_text = excluded.default_cta_text;

-- 6. Private Transport enquiry
insert into public.whatsapp_templates (
  key,
  label,
  template_text,
  placeholders,
  is_active,
  display_order,
  assigned_service_slug,
  default_cta_text
) values (
  'privateTransportEnquiry',
  'Private Transport Enquiry',
  'Assalamu Alaikum, Masaar Holidays.' || chr(10) || chr(10) ||
  'I would like to enquire about private transportation.' || chr(10) || chr(10) ||
  'Name:' || chr(10) ||
  'Travel date:' || chr(10) ||
  'Number of passengers:' || chr(10) ||
  'Pickup location:' || chr(10) ||
  'Destination: {{city}}' || chr(10) ||
  'Vehicle preference: {{service_option}}' || chr(10) ||
  'Luggage requirements:' || chr(10) || chr(10) ||
  'Please provide the available options and quotation.{{package_ref}}{{url_ref}}',
  array['city', 'service_option', 'package_name', 'service_url'],
  true,
  25,
  'private-transport',
  'Enquire on WhatsApp'
) on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  assigned_service_slug = excluded.assigned_service_slug,
  default_cta_text = excluded.default_cta_text;

-- 7. General Additional Services enquiry
insert into public.whatsapp_templates (
  key,
  label,
  template_text,
  placeholders,
  is_active,
  display_order,
  assigned_service_slug,
  default_cta_text
) values (
  'additionalServicesGeneral',
  'General Additional Services Enquiry',
  'Assalamu Alaikum, Masaar Holidays.' || chr(10) || chr(10) ||
  'I would like to enquire about additional services for my Umrah journey.' || chr(10) || chr(10) ||
  'Name:' || chr(10) ||
  'Travel date:' || chr(10) ||
  'Number of travellers:' || chr(10) ||
  'Services interested in: {{service_name}}' || chr(10) ||
  'Additional requirements:' || chr(10) || chr(10) ||
  'Please guide me with the available options.{{package_ref}}{{url_ref}}',
  array['service_name', 'package_name', 'service_url'],
  true,
  26,
  null,
  'Enquire on WhatsApp'
) on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  assigned_service_slug = excluded.assigned_service_slug,
  default_cta_text = excluded.default_cta_text;

