-- Migration: 0065_media_library.sql
-- A real catalog for annotating images already referenced across the site
-- (blog featured images, hotel photos, package hero images, private trip
-- galleries, etc.) with alt text and an optional caption, keyed by URL so
-- the same catalog covers both directly-uploaded files (media storage
-- bucket) and images already referenced by a content row's own column.
--
-- Where a content row already has its own alt-text column (currently only
-- blog_posts.hero_image_alt), the admin Media Library page keeps that
-- column in sync when its entry is edited here — this table is not a
-- second, disconnected source of truth for that case.
--
-- Apply manually in Supabase SQL Editor.

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  alt_text text,
  caption text,
  file_name text,
  width integer,
  height integer,
  uploaded_at timestamptz not null default now()
);

comment on table public.media_library is
  'Alt text / caption catalog for images already referenced across the site, keyed by URL. Not a copy of the images themselves — url points at the real file (Supabase storage or a static /public asset).';
comment on column public.media_library.url is
  'The image URL as referenced by content rows or the media storage bucket — unique so each real image has exactly one catalog entry.';

create index if not exists idx_media_library_uploaded_at on public.media_library (uploaded_at desc);

alter table public.media_library enable row level security;
create policy "media_library_admin_read" on public.media_library
  for select to authenticated using (true);
create policy "media_library_admin_write" on public.media_library
  for all to authenticated using (true) with check (true);
