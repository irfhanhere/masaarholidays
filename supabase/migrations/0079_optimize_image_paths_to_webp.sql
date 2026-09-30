-- Migration 0079: Update image paths to optimized lowercase-kebab-case WebP paths
-- Created as part of SEO & Speed Optimization Phase 6

BEGIN;

-- 1. Umrah Packages hero images
UPDATE packages
SET hero_image_url = REPLACE(hero_image_url, '/brand/banners/umrah.png', '/brand/banners/umrah.webp')
WHERE hero_image_url LIKE '%/brand/banners/umrah.png%';

-- 2. Hajj Packages hero images
UPDATE packages
SET hero_image_url = REPLACE(hero_image_url, '/brand/banners/hajj.png', '/brand/banners/hajj.webp')
WHERE hero_image_url LIKE '%/brand/banners/hajj.png%';

-- 3. Departure Months hero images
UPDATE umrah_departure_months
SET hero_image_url = REPLACE(hero_image_url, '/brand/banners/umrah.png', '/brand/banners/umrah.webp')
WHERE hero_image_url LIKE '%/brand/banners/umrah.png%';

-- 4. Visa Types hero images
UPDATE visa_types
SET hero_image_url = REPLACE(hero_image_url, '/brand/banners/destination.png', '/brand/banners/destination.webp')
WHERE hero_image_url LIKE '%/brand/banners/destination.png%';

-- 5. Private Trips images
UPDATE private_trips
SET hero_image_url = REPLACE(hero_image_url, '/trips/PRIVATE-TRIP-MAKKAH-HERO.png', '/trips/private-trip-makkah-hero.webp')
WHERE hero_image_url LIKE '%/trips/PRIVATE-TRIP-MAKKAH-HERO.png%';

UPDATE private_trips
SET hero_image_url = REPLACE(hero_image_url, '/trips/PRIVATE-TRIP-MADINAH-HERO.jpg', '/trips/private-trip-madinah-hero.webp')
WHERE hero_image_url LIKE '%/trips/PRIVATE-TRIP-MADINAH-HERO.jpg%';

UPDATE private_trips
SET card_image_url = REPLACE(card_image_url, '/trips/PRIVATE-TRIP-MAKKAH-CARD.png', '/trips/private-trip-makkah-card.webp')
WHERE card_image_url LIKE '%/trips/PRIVATE-TRIP-MAKKAH-CARD.png%';

UPDATE private_trips
SET card_image_url = REPLACE(card_image_url, '/trips/PRIVATE-TRIP-MADINAH-CARD.png', '/trips/private-trip-madinah-card.webp')
WHERE card_image_url LIKE '%/trips/PRIVATE-TRIP-MADINAH-CARD.png%';

-- 6. Blog Posts hero images
UPDATE blog_posts
SET hero_image_url = REPLACE(hero_image_url, '/brand/banners/umrah.png', '/brand/banners/umrah.webp')
WHERE hero_image_url LIKE '%/brand/banners/umrah.png%';

UPDATE blog_posts
SET hero_image_url = REPLACE(hero_image_url, '/trips/DESTINATION IMAGE.png', '/trips/destination-image.webp')
WHERE hero_image_url LIKE '%/trips/DESTINATION IMAGE.png%';

COMMIT;

