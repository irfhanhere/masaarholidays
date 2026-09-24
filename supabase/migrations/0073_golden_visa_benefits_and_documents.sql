-- Migration: 0073_golden_visa_benefits_and_documents.sql
-- Follow-up to 0072_emirates_id_to_golden_visa.sql (run that one first —
-- this depends on the visa_types row already being renamed to
-- 'golden-visa-assistance').
--
-- Adds a proper "Benefits" section to the Golden Visa Assistance page
-- (new visa_types.benefits column — optional per type, hidden entirely
-- when empty, so every other visa type is unaffected) and rounds out its
-- "Documents Required" grid with two commonly-needed items that weren't
-- covered in the first pass (National ID, Health Insurance), plus a more
-- specific note on the property-investment route — by far the most common
-- path applicants ask about — in the Important Information callout: a
-- Dubai property valued at AED 2 million or more (full or partial
-- ownership) is the standard real-estate threshold. Kept as one example
-- within the existing generic "varies by category" framing (investment,
-- property, business, specialised talent are all real routes) rather than
-- restructuring the whole page around property investment alone.
--
-- Content describes the real, publicly-known UAE Golden Visa programme
-- (10-year renewable residency, freedom to work/travel/invest, family
-- sponsorship, no local sponsor required) in Masaar's own words — still
-- generic and white-labeled, no named third-party provider, no external
-- link, per the original instruction.
--
-- Apply manually in Supabase SQL Editor, after 0072.

alter table public.visa_types
  add column if not exists benefits jsonb not null default '[]'::jsonb;

comment on column public.visa_types.benefits is
  'Optional "Benefits" section (title + description pairs) shown below the feature strip — jsonb array of {title, description}, admin-editable per type. Section is hidden entirely when empty, same pattern as who_needs_this.';

update public.visa_types set
  benefits = '[
    {"title": "A Decade-Long Residency", "description": "Valid for 10 years and renewable, giving you long-term security in the UAE."},
    {"title": "Freedom to Work, Travel and Invest", "description": "Live, work, travel and invest in the UAE without the restrictions of a shorter-term visa."},
    {"title": "Family Sponsorship", "description": "Sponsor your spouse, children and parents for the same 10-year period."},
    {"title": "No Local Sponsor Required", "description": "Reside in the UAE independently, without needing a local sponsor."},
    {"title": "Access to Everyday Services", "description": "Easier access to healthcare, education and other UAE services as a long-term resident."},
    {"title": "Sponsor Domestic Help", "description": "Sponsor domestic staff without the limits that apply to shorter-term visas."}
  ]'::jsonb,
  important_info_text = E'Golden Visa eligibility, requirements, processing times and fees can change and vary by category (investment, property, business, specialised talent, and others). As a guide, the property-investment route typically requires a Dubai property (or share of one) valued at AED 2 million or more, full ownership or off-plan; other categories have their own criteria. Please always verify the latest criteria with the relevant authority.\nMasaar Holidays facilitates applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.'
where slug = 'golden-visa-assistance';

-- Clean, deliberate ordering for the 5 existing cards from 0072, then the
-- 2 new ones appended below.
update public.visa_documents set display_order = 0 where visa_type_id = (select id from public.visa_types where slug = 'golden-visa-assistance') and title = 'Valid Passport';
update public.visa_documents set display_order = 1 where visa_type_id = (select id from public.visa_types where slug = 'golden-visa-assistance') and title = 'Recent Passport Photo';
update public.visa_documents set display_order = 2 where visa_type_id = (select id from public.visa_types where slug = 'golden-visa-assistance') and title = 'Completed Application';
update public.visa_documents set
  display_order = 3,
  description = 'Category-specific supporting documents — e.g. a Dubai property valued at AED 2 million+ (property route), or business/professional qualifications for other categories'
where visa_type_id = (select id from public.visa_types where slug = 'golden-visa-assistance') and title = 'Proof of Eligibility';
update public.visa_documents set display_order = 4 where visa_type_id = (select id from public.visa_types where slug = 'golden-visa-assistance') and title = 'Proof of Payment';

insert into public.visa_documents (title, description, display_order, visa_type_id, icon_key)
select 'National ID', 'Required for applicants of certain nationalities, where applicable', 5, vt.id, 'document'
from public.visa_types vt
where vt.slug = 'golden-visa-assistance'
  and not exists (select 1 from public.visa_documents d where d.visa_type_id = vt.id and d.title = 'National ID');

insert into public.visa_documents (title, description, display_order, visa_type_id, icon_key)
select 'Health Insurance', 'A valid UAE health insurance policy', 6, vt.id, 'shield'
from public.visa_types vt
where vt.slug = 'golden-visa-assistance'
  and not exists (select 1 from public.visa_documents d where d.visa_type_id = vt.id and d.title = 'Health Insurance');
