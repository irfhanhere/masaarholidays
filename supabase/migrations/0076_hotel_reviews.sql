-- Migration: 0076_hotel_reviews.sql
-- Enables hotel guest reviews and verified pilgrim experiences for public hotel cards and admin management.

create table if not exists public.hotel_reviews (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references public.hotels(id) on delete cascade,
  hotel_slug text not null,
  author_name text not null,
  travel_party text not null default 'Family',
  rating integer not null default 5,
  stay_month_year text not null,
  read_time text not null default '1 min read',
  title text not null,
  content text not null,
  highlight_quote text,
  helpful_tag text,
  is_verified boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hotel_reviews_hotel_slug on public.hotel_reviews(hotel_slug);
create index if not exists idx_hotel_reviews_hotel_id on public.hotel_reviews(hotel_id);

comment on table public.hotel_reviews is 'Verified pilgrim reviews and experiences for Makkah and Madinah hotels.';
