-- Seeds the 19 Makkah hotels from masaar-client-data-round2.md, Section 1
-- (client-shared Halalbooking reference map — real hotel names near Masjid
-- al-Haram). Only `name` and `city` are supplied by the source; category,
-- star rating and distance are intentionally left null rather than
-- guessed — see the source note: "[VERIFY BEFORE PUBLICATION] before
-- assigning categories; don't guess star ratings or exact walk times".
--
-- Seeded as is_active = false (draft) rather than immediately live: with
-- no photo or category yet, these shouldn't appear on the public Hotels
-- page until Haseeb reviews and activates each one from Admin -> Hotels.
-- Mövenpick Hotel & Residences Hajar Tower Makkah is excluded — already
-- in the database (entered via the admin panel before this migration).

insert into public.hotels (name, slug, city, is_active) values
  ('Al Marwa Rayhaan', 'al-marwa-rayhaan', 'Makkah', false),
  ('Swissôtel Makkah', 'swissotel-makkah', 'Makkah', false),
  ('Makarem Ajyad', 'makarem-ajyad', 'Makkah', false),
  ('Al Ghufran Safwah', 'al-ghufran-safwah', 'Makkah', false),
  ('Elaf Kinda', 'elaf-kinda', 'Makkah', false),
  ('Makkah Hotel & Towers', 'makkah-hotel-and-towers', 'Makkah', false),
  ('Intercontinental Dar Al Tawhid', 'intercontinental-dar-al-tawhid', 'Makkah', false),
  ('Makkah Clock Royal Tower', 'makkah-clock-royal-tower', 'Makkah', false),
  ('Zamzam Pullman', 'zamzam-pullman', 'Makkah', false),
  ('Swissôtel Al Maqam', 'swissotel-al-maqam', 'Makkah', false),
  ('Raffles Makkah Palace', 'raffles-makkah-palace', 'Makkah', false),
  ('Jumeirah Jabal Omar', 'jumeirah-jabal-omar', 'Makkah', false),
  ('Conrad Jabal Omar', 'conrad-jabal-omar', 'Makkah', false),
  ('Jabal Omar Hyatt Regency', 'jabal-omar-hyatt-regency', 'Makkah', false),
  ('Hilton Suites Makkah', 'hilton-suites-makkah', 'Makkah', false),
  ('Hilton Convention Makkah', 'hilton-convention-makkah', 'Makkah', false),
  ('Address Jabal Omar', 'address-jabal-omar', 'Makkah', false),
  ('Anjum Hotel', 'anjum-hotel', 'Makkah', false)
on conflict (slug) do nothing;
