-- Migration: 0064_blog_rebuild.sql
-- Rebuilds the Blog admin data model to match the new Blog admin spec:
-- real Categories table (was a free-text column), tags, a simple author
-- name field (no admin_users/profile system exists in this app), richer
-- SEO fields, social-sharing overrides, a content_format flag so existing
-- plain-text posts keep rendering exactly as before while new posts can
-- store real HTML from a WYSIWYG editor, and scheduled publishing.
--
-- Fully additive and non-destructive: the old `blog_posts.category` text
-- column is kept (not dropped) and backfilled into the new table/column
-- rather than replaced outright.
--
-- Apply manually in Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. blog_categories
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  seo_title text,
  meta_description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger blog_categories_set_updated_at
  before update on public.blog_categories
  for each row execute function public.set_updated_at();

alter table public.blog_categories enable row level security;
create policy "blog_categories_public_read" on public.blog_categories
  for select using (status = 'active');
create policy "blog_categories_admin_read" on public.blog_categories
  for select to authenticated using (true);
create policy "blog_categories_admin_write" on public.blog_categories
  for all to authenticated using (true) with check (true);

-- Backfill: one category per distinct existing blog_posts.category value.
insert into public.blog_categories (name, slug)
select distinct
  category,
  regexp_replace(regexp_replace(lower(trim(category)), '[^a-z0-9\s-]', '', 'g'), '\s+', '-', 'g')
from public.blog_posts
where category is not null and trim(category) <> ''
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. blog_posts — new columns
-- ─────────────────────────────────────────────────────────────────────────
alter table public.blog_posts
  add column if not exists category_id uuid references public.blog_categories(id) on delete set null,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists author_name text not null default 'Haseeb',
  add column if not exists is_featured boolean not null default false,
  add column if not exists hero_image_alt text,
  -- 'legacy' = the existing "## heading" / "- bullet" plain-text markup (renderLegalContent).
  -- 'html'   = real HTML from the WYSIWYG editor. Lets old posts keep rendering exactly as
  -- before while new posts get full rich-text formatting.
  add column if not exists content_format text not null default 'legacy' check (content_format in ('legacy', 'html')),
  add column if not exists focus_keyword text,
  add column if not exists canonical_url text,
  add column if not exists noindex boolean not null default false,
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists og_image_url text,
  -- When set on a draft, the post is shown as "Scheduled" in the admin list and is
  -- auto-published by the /api/cron/publish-scheduled-posts route once this time passes.
  add column if not exists scheduled_at timestamptz;

comment on column public.blog_posts.category_id is 'References blog_categories.id. The old free-text category column is kept for existing data but no longer written to by the admin UI.';
comment on column public.blog_posts.content_format is '''legacy'' = old ##/- plain-text markup rendered by renderLegalContent(); ''html'' = real HTML from the rich-text editor.';
comment on column public.blog_posts.scheduled_at is 'Future publish time for a draft post. The publish-scheduled-posts cron flips status to published once this passes.';

update public.blog_posts p
set category_id = c.id
from public.blog_categories c
where p.category_id is null and p.category is not null and trim(p.category) = c.name;

create index if not exists idx_blog_posts_category_id on public.blog_posts (category_id);
create index if not exists idx_blog_posts_scheduled_at on public.blog_posts (scheduled_at) where scheduled_at is not null;
