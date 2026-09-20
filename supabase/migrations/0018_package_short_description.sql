-- Tier-level "short description" (1-2 sentences) shown under the tier
-- heading on /umrah, /hajj and Umrah departure-month pages, above that
-- tier's card(s) — e.g. "A warm, comfortable introduction to Umrah,
-- without compromising on care." Synced across duration-variant sibling
-- rows exactly like title/inclusions_text/city_destination already are
-- (see app/admin/(dashboard)/packages/actions.ts#savePackage's
-- sibling-sync update) — not duplicated per duration.
--
-- Nullable so packages can be drafted before their tier copy is approved.
alter table public.packages
  add column if not exists short_description text;

comment on column public.packages.short_description is
  'Tier-level, 1-2 sentences, shown under the tier heading on listing pages. Synced across duration-variant siblings, not duplicated per duration.';
