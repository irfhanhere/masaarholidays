-- Visa section rebuild — adds the fields needed for one shared detail-page
-- template serving all 6 visa types (Umrah, UAE, Global, Saudi Tourist,
-- Emirates ID, India) at /visa/[slug], per the two attached reference
-- mockups (Visa Section — All 7 Screens; detailed Umrah Visa page).
--
-- visa_types was previously just slug/name/description/audience_text —
-- fine for the old one-page /visa listing, but the new per-type detail
-- page needs its own hero, feature strip, documents intro, important-info
-- callout and an optional "who may need this" list, all admin-editable
-- per type (same "tier-level admin-editable field" pattern already used
-- for packages.maktab_category etc.).
alter table public.visa_types
  add column if not exists hero_headline text,
  add column if not exists hero_intro text,
  add column if not exists hero_image_url text,
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists documents_intro text,
  add column if not exists important_info_text text,
  add column if not exists who_needs_this jsonb not null default '[]'::jsonb,
  add column if not exists cta_note text;

comment on column public.visa_types.hero_headline is
  'Detail-page hero H1, e.g. "Your Journey Starts Here". Falls back to name if unset.';
comment on column public.visa_types.hero_intro is
  '1-2 sentence hero paragraph under the headline.';
comment on column public.visa_types.hero_image_url is
  'Detail-page hero background photo. Falls back to a generic banner if unset.';
comment on column public.visa_types.features is
  'The 4-icon feature strip below the hero — jsonb array of {icon_key, label}, admin-editable per type, e.g. [{"icon_key":"document","label":"Guidance at Every Step"}, ...].';
comment on column public.visa_types.documents_intro is
  'Intro line under the "Documents Required" heading.';
comment on column public.visa_types.important_info_text is
  'The warning-style "Important Information" callout — paragraphs separated by a blank line.';
comment on column public.visa_types.who_needs_this is
  'Optional "Who May Need This Service?" bullet list — jsonb array of strings. Section is hidden entirely when empty (default): only visa types with this populated show it.';
comment on column public.visa_types.cta_note is
  'Small note under the bottom CTA buttons, e.g. "Our team is available to assist you during working hours."';

-- visa_documents was scoped only to the 4 booking-flow contexts
-- (umrah_package/standalone_umrah_visa/hotel/hajj — a different concern:
-- "which product is this checklist for", not "which visa type"). The new
-- per-visa-type "Documents Required" grid needs documents attachable to a
-- visa_types row directly, so a document now belongs to EITHER a context
-- OR a visa type, never both/neither — context_id becomes nullable and a
-- new nullable visa_type_id is added alongside it, enforced by the check
-- constraint below. The original context-based checklists (and their
-- admin screen at /admin/visa-content) are untouched.
alter table public.visa_documents
  alter column context_id drop not null,
  add column if not exists visa_type_id uuid references public.visa_types (id) on delete cascade,
  add column if not exists icon_key text not null default 'document';

comment on column public.visa_documents.visa_type_id is
  'Set for visa-type-scoped documents (the new per-type "Documents Required" grid). Mutually exclusive with context_id — see visa_documents_exactly_one_parent.';
comment on column public.visa_documents.icon_key is
  'Line-icon shown on the document card. Fixed set: passport, photo, document, flight, hotel, shield, payment, group. Defaults to "document" if unset/unrecognized.';

alter table public.visa_documents
  add constraint visa_documents_exactly_one_parent
    check (
      (context_id is not null and visa_type_id is null)
      or (context_id is null and visa_type_id is not null)
    );

create index if not exists visa_documents_visa_type_id_idx on public.visa_documents (visa_type_id);
