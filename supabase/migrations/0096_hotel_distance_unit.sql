-- Migration: 0096_hotel_distance_unit.sql
-- Add distance_unit to public.hotels to allow admins to choose between meters ('m') and kilometers ('km').

alter table public.hotels
  add column if not exists distance_unit text default 'm';

comment on column public.hotels.distance_unit is 'Display and entry unit for distance to Haram: "m" (meters) or "km" (kilometers)';

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
