-- Migration: 0052_umrah_journey_inclusions_override.sql
-- Sets inclusions_override on the Makkah+Madinah combined configurations so
-- the new Umrah Journey page shows the correct combined-journey inclusions
-- list (per tier, from the client's Makkah+Madinah packages document)
-- instead of the tier's Makkah-only packages.inclusions_text default —
-- inclusions_override exists exactly for this (see its column comment in
-- 0042_umrah_inventory_architecture.sql).
--
-- Applies to all 7 duration configs per tier (same inclusions regardless
-- of duration, matching the source document).
--
-- Apply manually in Supabase SQL Editor.

update public.umrah_inventory_configurations c
set inclusions_override =
  'Accommodation in Makkah (VOCO) & Madinah (Zowar International)
Private end-to-end transfers (Jeddah Airport → Makkah Hotel → Madinah Hotel → Madinah Airport)
24/7 Makkah shuttle service
24/7 Masaar Holidays guest support'
from public.packages p
where p.id = c.package_id
  and p.type = 'umrah' and p.slug = 'umrah-essential-placeholder'
  and c.journey_type = 'makkah_madinah';

update public.umrah_inventory_configurations c
set inclusions_override =
  'Luxury accommodation in Makkah (Jabal Omar Marriott) & Madinah (Millennium Taiba)
Breakfast included
Complete private vehicle mobility sequence
Private guided Makkah Ziyarat tour (Sedan included)
Umrah visa processing & concierge support'
from public.packages p
where p.id = c.package_id
  and p.type = 'umrah' and p.slug = 'umrah-signature-placeholder'
  and c.journey_type = 'makkah_madinah';

update public.umrah_inventory_configurations c
set inclusions_override =
  '5-Star luxury properties in Makkah (Dar Al Tawheed) & Madinah (Dar Al Hijra) with gourmet breakfast
VIP private luxury vehicle transfers across all legs
Private guided Makkah Ziyarat tour with local specialist guide
Express luggage handling, priority check-in, Umrah visa processing, and 24/7 dedicated VIP concierge'
from public.packages p
where p.id = c.package_id
  and p.type = 'umrah' and p.slug = 'umrah-exclusive-placeholder'
  and c.journey_type = 'makkah_madinah';
