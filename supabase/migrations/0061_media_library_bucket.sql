-- Migration: 0061_media_library_bucket.sql
-- Replaces the "Coming Soon" Media Library admin stub with a real
-- Supabase Storage bucket. Every content form on the site (hotels,
-- packages, private trips, blog, etc.) already takes a plain image URL
-- text field — this doesn't change those forms, it gives the admin a
-- place to upload an image and get a real hosted URL to paste into any
-- of them, instead of needing to host images elsewhere first.
--
-- Apply manually in Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Public read (bucket is public anyway, but explicit policies are still
-- required for the storage.objects table itself under RLS).
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

create policy "media_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'media');

create policy "media_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media');
