-- Migration: 0060_blog_posts.sql
-- Replaces the "Coming Soon" Blog admin stub and the public /blog
-- "no articles published yet" empty state with a real, admin-managed
-- blog CMS. No articles are seeded here — per the existing stub's own
-- note, the 18 planned articles haven't been drafted yet, so this
-- migration only builds the machinery; content is added via
-- Admin → Blog once articles are written (never fabricated here).
--
-- Apply manually in Supabase SQL Editor.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  category text,
  hero_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  meta_title text,
  meta_description text,
  published_at timestamptz,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_idx on public.blog_posts (status, published_at desc);

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

create policy "blog_posts_public_read" on public.blog_posts
  for select using (status = 'published');
create policy "blog_posts_admin_all" on public.blog_posts
  for all to authenticated using (true) with check (true);
