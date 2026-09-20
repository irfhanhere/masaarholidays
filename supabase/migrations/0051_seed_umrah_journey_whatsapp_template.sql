-- Migration: 0051_seed_umrah_journey_whatsapp_template.sql
-- Seeds the WhatsApp template for the new Umrah Journey page
-- (/umrah/departures/[month]/[tier]) so its "Enquire on WhatsApp" CTA is
-- admin-editable from day one, same as every other WhatsApp button on the
-- site (see 0013_whatsapp_templates.sql / 0014_seed_whatsapp_templates.sql).
--
-- Apply manually in Supabase SQL Editor.

insert into public.whatsapp_templates (key, label, template_text, placeholders, display_order) values
  ('umrahJourney', 'Umrah Journey Page (Makkah + Madinah, month + tier)',
   'Assalamu Alaikum,' || chr(10) || chr(10) ||
   'I''m interested in:' || chr(10) || chr(10) ||
   '{{packageName}}' || chr(10) ||
   '{{journey}}' || chr(10) ||
   '{{month}}' || chr(10) || chr(10) ||
   'Duration:' || chr(10) ||
   '{{duration}}' || chr(10) || chr(10) ||
   'Stay:' || chr(10) ||
   '{{stay}}' || chr(10) || chr(10) ||
   'Occupancy:' || chr(10) ||
   '{{occupancy}}' || chr(10) || chr(10) ||
   'Price shown:' || chr(10) ||
   '{{price}}' || chr(10) || chr(10) ||
   'Please share availability and more details.' || chr(10) || chr(10) ||
   'JazakAllah Khair.',
   array['packageName', 'journey', 'month', 'duration', 'stay', 'occupancy', 'price'],
   16)
on conflict (key) do nothing;
