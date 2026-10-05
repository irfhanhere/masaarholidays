-- Migration 0081: Fix 5N/6D Essential package config to Makkah+Madinah combined journey for all months
UPDATE public.umrah_inventory_configurations
SET
  journey_type = 'makkah_madinah',
  month_id = NULL,
  madinah_hotel_id = '0dbb2b1e-78ee-43b6-8613-b094e1f7f170'
WHERE id = '48a9fd97-25e7-433f-a7f2-1a805b2713d3';
