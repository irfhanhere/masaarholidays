-- Migration: 0063_package_default_addons.sql
-- The Umrah Package Tier editor (Admin -> Packages -> Umrah -> Edit Tier) has
-- an "Add-ons" checkbox list, but savePackageTierMaster never persisted the
-- selection anywhere — toggling a checkbox and saving silently did nothing.
-- This adds a column to actually store it. Empty array means "not yet
-- configured" and the admin form falls back to showing all published
-- catalog add-ons checked, same as today's behaviour.
--
-- Apply manually in Supabase SQL Editor.

alter table public.packages
  add column if not exists default_addon_slugs text[] not null default '{}'::text[];

comment on column public.packages.default_addon_slugs is
  'key_slug values from package_addons_catalog enabled by default for this tier. Empty = not yet configured (admin UI defaults to all published add-ons checked).';
