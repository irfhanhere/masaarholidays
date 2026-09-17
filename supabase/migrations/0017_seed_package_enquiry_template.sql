-- New WhatsApp template key for the Umrah/Hajj package enquiry popup
-- (replaces the plain "WhatsApp" button on package cards/detail pages
-- with a pre-enquiry builder — flight/visa/hotel/transfer add-on
-- toggles). This is only the FIXED opening line; the popup appends the
-- conditional add-on lines and, when reached from a departure-month
-- page, the month line client-side (see PackageEnquiryButton.tsx) —
-- interpolate()'s flat {{token}} replacement can't express "only show
-- this line if selected", so that part deliberately isn't in the
-- template text itself.
insert into public.whatsapp_templates (key, label, template_text, placeholders, display_order) values
  ('packageEnquiry', 'Umrah/Hajj Package — Enquiry Popup (opening line)',
   'Assalamu Alaikum, I''d like to enquire about {{packageTitle}} ({{tier}} — {{duration}}).',
   array['packageTitle','tier','duration'], 13)
on conflict (key) do nothing;
