-- Seeds the 4 required visa document-set contexts as empty shells
-- (structural rows only — no document checklist copy, that's still
-- pending Haseeb's per-visa-type input, see content-seo-starter-kit.md
-- Section 4, item 13).
insert into public.visa_document_contexts (context_key, label) values
  ('umrah_package', 'Umrah Package'),
  ('standalone_umrah_visa', 'Standalone Umrah Visa'),
  ('hotel', 'Hotel Booking'),
  ('hajj', 'Hajj Package')
on conflict (context_key) do nothing;
