-- Tier-level "short description" (1-2 sentences) shown under the tier
-- heading on /umrah, /hajj and Umrah departure-month pages, above that
-- tier's card(s) — e.g. "A warm, comfortable introduction to Umrah,
-- without compromising on care." Synced across duration-variant sibling
-- rows exactly like title/inclusions_text/city_destination already are
-- (see app/admin/(dashboard)/packages/actions.ts#savePackage's
-- sibling-sync update) — not duplicated per duration.
--
-- Nullable, no backfill: no real copy has been provided for the 6
-- existing placeholder packages, and inventing marketing copy isn't
-- this project's call to make (same "no invented content" rule already
-- applied to itineraries, testimonials, etc.) — the public pages show a
-- neutral "Description pending" fallback instead until Haseeb writes
-- real text per tier.
alter table public.packages
  add column if not exists short_description text;

comment on column public.packages.short_description is
  'Tier-level, 1-2 sentences, shown under the tier heading on listing pages. Synced across duration-variant siblings, not duplicated per duration.';
