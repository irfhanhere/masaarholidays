-- Migration: 0066_media_library_public_read.sql
-- media_library (0065) was only readable by authenticated (admin) sessions.
-- The public private-trip gallery needs to read alt_text for its images
-- too, so this adds a public read policy alongside the existing
-- authenticated one (Postgres RLS allows multiple permissive policies —
-- this doesn't replace or weaken the admin write policy).
--
-- Apply manually in Supabase SQL Editor.

create policy "media_library_public_read" on public.media_library
  for select using (true);
