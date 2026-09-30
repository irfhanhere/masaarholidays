-- 0078_seo_metadata_titles_and_descriptions.sql
-- SEO metadata fixes: standardize Hajj titles (<=60 chars), clean meta descriptions (120-155 chars with CTA),
-- rewrite scraped Elaf Kinda hotel description, and add missing static page descriptions.

-- 1. Standardize Hajj package titles and descriptions (max 60 chars title, 120-155 chars description with CTA)
UPDATE public.packages
SET 
  meta_title = '9-Day Essential Hajj from UAE | Masaar Holidays',
  meta_description = 'Book 9-Day Essential Hajj from UAE with economy Aziziyah hotel, Category A Mina tents near Jamarat, direct flights, and all meals. Plan with Masaar today.'
WHERE slug = 'hajj-essential-9-days';

UPDATE public.packages
SET 
  meta_title = '12-Day Essential Hajj from UAE | Masaar Holidays',
  meta_description = 'Book 12-Day Essential Hajj from UAE. Economy Aziziyah stay, Madinah hotel near Haram, Category A Mina tents, and direct flights. Plan with Masaar.'
WHERE slug = 'hajj-essential-12-days';

UPDATE public.packages
SET 
  meta_title = '15-Day Essential Hajj from UAE | Masaar Holidays',
  meta_description = '15-Day Essential Hajj from UAE with Aziziyah stay, Madinah hotel, Makkah Clock Tower, and Category A Mina tents. Full support with Masaar Holidays.'
WHERE slug = 'hajj-essential-15-days';

UPDATE public.packages
SET 
  meta_title = '9-Day Signature Hajj from UAE | Masaar Holidays',
  meta_description = 'Book 9-Day Signature Hajj from UAE with 4-star Aziziyah hotel, Category A Mina tents, direct flights, and full-board dining. Plan with Masaar today.'
WHERE slug = 'hajj-signature-9-days';

UPDATE public.packages
SET 
  meta_title = '12-Day Signature Hajj from UAE | Masaar Holidays',
  meta_description = '12-Day Signature Hajj from UAE. 4-star Aziziyah stay, Madinah hotel near Haram, Category A Mina camps, and direct flights. Enquire with Masaar today.'
WHERE slug = 'hajj-signature-12-days';

UPDATE public.packages
SET 
  meta_title = '15-Day Signature Hajj from UAE | Masaar Holidays',
  meta_description = '15-Day Signature Hajj from UAE with 4-star Aziziyah, Madinah hotel, Makkah Clock Tower, and Category A Mina camps. Complete guidance with Masaar.'
WHERE slug = 'hajj-signature-15-days';

UPDATE public.packages
SET 
  meta_title = '10-Day Exclusive Hajj from UAE | Masaar Holidays',
  meta_description = 'Book our 10-Day Exclusive non-shifting Hajj package from UAE. Clock Tower stay, Category A Mina camps, direct flights & full support. Plan with Masaar.'
WHERE slug = 'hajj-exclusive-10-days';

UPDATE public.packages
SET 
  meta_title = '13-Day Exclusive Hajj from UAE | Masaar Holidays',
  meta_description = '13-Day Exclusive non-shifting Hajj from UAE. Clock Tower Marwa Rotana, 5-star Madinah hotel, Category A Mina tents & full support. Plan with Masaar.'
WHERE slug = 'hajj-exclusive-13-days';

-- 2. Rewrite scraped Elaf Kinda hotel description & set unique metadata
UPDATE public.hotels
SET
  description = '5-star comfort adjacent to King Abdul Aziz endowment in Makkah. Convenient walking access to the Haram courtyard and comfortable family rooms. Book with Masaar.',
  meta_title = 'Elaf Kinda Makkah | Masaar Holidays',
  meta_description = 'Book Elaf Kinda in Makkah. 5-star comfort adjacent to the Haram courtyard, stylish family rooms, and full pilgrimage assistance with Masaar Holidays UAE.'
WHERE slug = 'elaf-kinda';

-- 3. Update / Insert static page SEO rows in page_seo table
INSERT INTO public.page_seo (path, meta_title, meta_description, updated_at)
VALUES 
  ('/', 'Umrah Travel Agency UAE | Masaar Holidays', 'Private, family-paced Umrah journeys from the UAE. Thoughtful planning, handpicked hotels, and personal support from start to finish. Plan your journey today.', now()),
  ('/visa', 'Visa & Document Assistance | Masaar Holidays', 'Reliable visa and travel document assistance from the UAE. Clear guidance on Umrah, Saudi tourist, and global visas. Get in touch with our team today.', now()),
  ('/transfers', 'Private Umrah Transfers | Masaar Holidays', 'Private Umrah transfers between Jeddah, Makkah, and Madinah with clean vehicles, professional drivers, and punctual service. Book your transfer today.', now()),
  ('/privacy-policy', 'Privacy Policy | Masaar Holidays', 'Read the Masaar Holidays privacy policy covering how we collect, protect, and handle personal information for your Umrah, Hajj, and UAE travel bookings.', now()),
  ('/terms-conditions', 'Terms & Conditions | Masaar Holidays', 'Review the booking terms, payment policies, cancellation guidelines, and service agreements for Umrah and Hajj packages with Masaar Holidays UAE.', now())
ON CONFLICT (path) DO UPDATE SET
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = now();
