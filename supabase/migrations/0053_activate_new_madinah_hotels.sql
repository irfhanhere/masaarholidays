-- Migration: 0053_activate_new_madinah_hotels.sql
-- Fixes a bug from 0047_umrah_makkah_madinah_configs.sql: "Zowar
-- International Hotel" and "Millennium Taiba Hotel" were seeded with
-- is_active = false (matching the "not yet reviewed" convention for
-- listing on /hotels), but public.hotels' RLS read policy is
-- `for select using (is_active)` — which also hides an inactive hotel from
-- every embedded join that reads it (e.g. the Umrah Journey page's
-- "Your Hotels" cards), not just the standalone /hotels directory. That
-- made the Madinah hotel card silently disappear for Essential and
-- Signature's Makkah+Madinah packages.
--
-- Activating them here so they resolve correctly wherever a package
-- references them; they'll also now appear on /hotels itself without full
-- walk/terrain detail until that's provided, same as any other hotel with
-- partial data.
--
-- Apply manually in Supabase SQL Editor.

update public.hotels
set is_active = true
where slug in ('zowar-international', 'millennium-taiba');
