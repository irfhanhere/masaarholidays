-- Package detail fields — masaar-client-data-round3.md's placeholder-
-- package structure, extended per the follow-up request that added
-- duration_label/validity_label/inclusions_text/advance_booking_note/
-- flight_note/rate_disclaimer to `packages`.
--
-- All nullable free text. duration_label/validity_label are DISPLAY
-- strings, distinct from the existing numeric `duration_days` — e.g.
-- duration_days=7 but duration_label="6 Nights / 7 Days".
alter table public.packages
  add column if not exists duration_label text,
  add column if not exists validity_label text,
  add column if not exists inclusions_text text,
  add column if not exists advance_booking_note text,
  add column if not exists flight_note text,
  add column if not exists rate_disclaimer text;

comment on column public.packages.duration_label is 'Display string, e.g. "6 Nights / 7 Days" — independent of the numeric duration_days.';
comment on column public.packages.validity_label is 'Display string for when the package/rate applies, e.g. a date range once real dates exist.';
comment on column public.packages.inclusions_text is 'Free-text inclusions list shown on the package detail page.';
comment on column public.packages.advance_booking_note is 'e.g. recommended lead time to book.';
comment on column public.packages.flight_note is 'e.g. whether international flights are included.';
comment on column public.packages.rate_disclaimer is 'Pricing caveat shown near the room pricing table.';

-- ─────────────────────────────────────────────────────────────────────────
-- Populate the 6 placeholder packages from 0011_seed_placeholder_packages.sql.
--
-- Text here reflects each tier's OWN already-approved positioning from
-- masaar-holidays-website-brief.md Part 1 (Essential: "Comfortable stay •
-- Shuttle • Visa • Transfers"; Signature: "Closer hotel • Walking access •
-- Better room options"; Privé: "An elevated Masaar experience") — not a
-- competitor's specific hotel/price combination, and no invented dates:
-- validity_label stays generic ("arranged with your advisor") rather than
-- fabricating a real date range that hasn't been confirmed.
-- ─────────────────────────────────────────────────────────────────────────

update public.packages set
  duration_label = '6 Nights / 7 Days',
  validity_label = 'Travel dates arranged directly with your advisor',
  inclusions_text = E'Comfortable hotel stay\nPrivate shuttle transport\nVisa processing\nAirport transfers',
  advance_booking_note = 'Recommended to book at least 3-4 weeks in advance to secure availability.',
  flight_note = 'International flights are not included — we can help arrange these separately on request.',
  rate_disclaimer = 'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.'
where slug = 'umrah-essential-placeholder';

update public.packages set
  duration_label = '9 Nights / 10 Days',
  validity_label = 'Travel dates arranged directly with your advisor',
  inclusions_text = E'Closer hotel, within walking distance to the Haram\nPrivate transport\nVisa processing\nGuided support throughout your journey',
  advance_booking_note = 'Recommended to book at least 3-4 weeks in advance to secure availability.',
  flight_note = 'International flights are not included — we can help arrange these separately on request.',
  rate_disclaimer = 'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.'
where slug = 'umrah-signature-placeholder';

update public.packages set
  duration_label = '9 Nights / 10 Days',
  validity_label = 'Travel dates arranged directly with your advisor',
  inclusions_text = E'Premium hotel, closest available proximity to the Haram\nPrivate transport throughout\nVisa processing\nDedicated personal support from start to finish',
  advance_booking_note = 'Recommended to book at least 4-6 weeks in advance given limited premium availability.',
  flight_note = 'International flights are not included — we can help arrange these separately on request.',
  rate_disclaimer = 'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.'
where slug = 'umrah-prive-placeholder';

update public.packages set
  duration_label = '13 Nights / 14 Days',
  validity_label = 'Travel dates arranged directly with your advisor',
  inclusions_text = E'Comfortable hotel stay\nPrivate shuttle transport\nVisa processing\nAirport transfers',
  advance_booking_note = 'Hajj travel fills up early — recommended to register your interest well ahead of the season.',
  flight_note = 'International flights are not included — we can help arrange these separately on request.',
  rate_disclaimer = 'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.'
where slug = 'hajj-essential-placeholder';

update public.packages set
  duration_label = '13 Nights / 14 Days',
  validity_label = 'Travel dates arranged directly with your advisor',
  inclusions_text = E'Closer hotel, within walking distance to the Haram\nPrivate transport\nVisa processing\nGuided support throughout your journey',
  advance_booking_note = 'Hajj travel fills up early — recommended to register your interest well ahead of the season.',
  flight_note = 'International flights are not included — we can help arrange these separately on request.',
  rate_disclaimer = 'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.'
where slug = 'hajj-signature-placeholder';

update public.packages set
  duration_label = '15 Nights / 16 Days',
  validity_label = 'Travel dates arranged directly with your advisor',
  inclusions_text = E'Premium hotel, closest available proximity to the Haram\nPrivate transport throughout\nVisa processing\nDedicated personal support from start to finish',
  advance_booking_note = 'Hajj travel fills up early, especially at this level — recommended to register your interest as soon as possible.',
  flight_note = 'International flights are not included — we can help arrange these separately on request.',
  rate_disclaimer = 'Prices shown are per person, indicative, and subject to availability. Final price is confirmed on WhatsApp.'
where slug = 'hajj-prive-placeholder';
