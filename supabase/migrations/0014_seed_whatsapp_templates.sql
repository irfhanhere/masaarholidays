-- Seeds whatsapp_templates with the EXACT text that was hardcoded in
-- src/lib/whatsapp-templates.ts (masaar-holidays-website-brief.md Part 6
-- "finalized draft" + two templates added since for hotel/package room
-- pricing) — nothing changes for visitors when this migration runs; only
-- placeholder syntax is normalised from JS template-literal `${x}` to the
-- admin UI's `{{x}}` tokens.
insert into public.whatsapp_templates (key, label, template_text, placeholders, display_order) values
  ('general', 'General Enquiry (header, home, footer, floating button)',
   'Assalamu Alaikum, I''d like to know more about Masaar Holidays.', '{}', 1),

  ('umrahEssential', 'Umrah — Essential Package',
   'Assalamu Alaikum, I''d like more details on the Masaar Essential Umrah package.', '{}', 2),

  ('umrahSignature', 'Umrah — Signature Package',
   'Assalamu Alaikum, I''d like more details on the Masaar Signature Umrah package.', '{}', 3),

  ('umrahPrive', 'Umrah — Privé Package',
   'Assalamu Alaikum, I''d like more details on the Masaar Privé Umrah experience.', '{}', 4),

  ('upgradeToPlus', 'Package — Upgrade to Plus',
   'Assalamu Alaikum, I''d like to know more about upgrading to {{tier}} Plus.', array['tier'], 5),

  ('hajj', 'Hajj — General Interest',
   'Assalamu Alaikum, I''d like to register my interest in Masaar''s Hajj packages.', '{}', 6),

  ('hotel', 'Hotel — General Enquiry',
   'Assalamu Alaikum, I''d like more information on {{hotelName}}.', array['hotelName'], 7),

  ('hotelRoom', 'Hotel — Specific Room Enquiry',
   'Assalamu Alaikum, I''d like more information on the {{roomType}} room at {{hotelName}}.', array['hotelName','roomType'], 8),

  ('packageRoom', 'Package — Specific Room Option Enquiry',
   'Assalamu Alaikum, I''d like more information on the {{roomType}} room option for the {{packageTitle}} package.', array['packageTitle','roomType'], 9),

  ('transfer', 'Transfers — Route Enquiry',
   'Assalamu Alaikum, I''d like to arrange a private transfer: {{route}}.', array['route'], 10),

  ('visa', 'Visa — Type Enquiry',
   'Assalamu Alaikum, I''d like help with a visa: {{visaType}}.', array['visaType'], 11),

  ('contact', 'Contact Page — WhatsApp CTA',
   'Assalamu Alaikum, I''d like to speak with the Masaar team.', '{}', 12)
on conflict (key) do nothing;

insert into public.whatsapp_settings (id, phone_number) values (1, '971552276299')
on conflict (id) do nothing;
