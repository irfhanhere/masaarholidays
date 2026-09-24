-- Migration: 0070_ziyarat_vehicle_photos.sql
-- Adds real vehicle photos for the three Ziyarat vehicle types (Sedan,
-- Staria, GMC Yukon / Suburban) — supplied by the client, saved to
-- public/vehicles/. Single source of truth (ziyarat_vehicle_types.image_url),
-- so this fixes every page that reads it: the Umrah package detail page's
-- "Private Vehicles Catalog & Ziyarat Pricing" cards (previously showing a
-- 🚗 emoji placeholder) and Admin → Vehicles.
--
-- coalesce()'d so this never clobbers a photo already set by an admin.
--
-- Apply manually in Supabase SQL Editor.

update public.ziyarat_vehicle_types set image_url = coalesce(image_url, '/vehicles/sedan.jpg')
where name = 'Sedan';

update public.ziyarat_vehicle_types set image_url = coalesce(image_url, '/vehicles/staria.jpg')
where name = 'Staria';

update public.ziyarat_vehicle_types set image_url = coalesce(image_url, '/vehicles/gmc-yukon-suburban.jpg')
where name = 'GMC Yukon / Suburban';
