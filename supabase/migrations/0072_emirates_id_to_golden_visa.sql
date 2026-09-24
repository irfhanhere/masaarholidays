-- Migration: 0072_emirates_id_to_golden_visa.sql
--
-- Converts the "Emirates ID Services" visa-type page into "Golden Visa
-- Assistance", per client instruction (Phase 1, item 1b). This is a full
-- content rewrite of the existing visa_types row (slug 'emirates-id' ->
-- 'golden-visa-assistance') and its visa_documents rows — not a new row —
-- so the existing page keeps its display_order, is_active state, and
-- created_at history.
--
-- Content is white-labeled as Masaar's own assistance offering: generic
-- UAE Golden Visa description (10-year residency, work/travel/invest,
-- family sponsorship, no local sponsor required), no named third-party
-- provider, no external link, matching how every other visa-type page on
-- this site already reads (Masaar "facilitates... but cannot guarantee
-- approval").
--
-- Note: matched by the OLD slug 'emirates-id' in the WHERE clause since
-- that's still correct at the moment this migration runs; the row's own
-- slug is changed to 'golden-visa-assistance' by the SET clause. Code
-- (lib/nav.ts) was updated in the same commit to link to the new slug.
--
-- Apply manually in Supabase SQL Editor.

update public.visa_types set
  slug = 'golden-visa-assistance',
  name = 'Golden Visa Assistance',
  description = 'Guidance and support for the UAE Golden Visa — 10-year residency for eligible individuals and their families.',
  hero_headline = 'Golden Visa Assistance',
  hero_intro = 'A 10-year UAE residency visa for eligible individuals and their families — live, work, study, travel or invest in the UAE without a local sponsor. We guide you through eligibility and the application process from start to finish.',
  documents_intro = 'The following is generally required to begin a UAE Golden Visa application — exact requirements vary by eligibility category.',
  important_info_text = E'Golden Visa eligibility, requirements, processing times and fees can change and vary by category (investment, property, business, specialised talent, and others). Please always verify the latest criteria with the relevant authority.\nMasaar Holidays facilitates applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.',
  who_needs_this = '["Individuals seeking long-term UAE residency", "Investors, entrepreneurs and skilled professionals", "Families wishing to sponsor dependents without a local sponsor"]'::jsonb,
  meta_title = 'Golden Visa Assistance | Masaar Holidays',
  meta_description = 'Guidance and support for the UAE 10-year Golden Visa — eligibility, application assistance and family sponsorship, arranged through Masaar Holidays.'
where slug = 'emirates-id';

-- "Proof of Payment" document card explicitly named the old service.
update public.visa_documents set
  description = 'Applicable government application fee receipt'
where visa_type_id = (select id from public.visa_types where slug = 'golden-visa-assistance')
  and title = 'Proof of Payment';

-- Golden Visa eligibility genuinely varies by category (investment,
-- property, business, specialised talent, etc.) in a way the old
-- Emirates ID checklist didn't need to cover — adds a 5th document card
-- rather than implying one fixed document list fits every applicant.
insert into public.visa_documents (title, description, display_order, visa_type_id, icon_key)
select
  'Proof of Eligibility',
  'Category-specific supporting documents (e.g. investment, property, business or professional qualifications)',
  4,
  vt.id,
  'document'
from public.visa_types vt
where vt.slug = 'golden-visa-assistance'
  and not exists (
    select 1 from public.visa_documents d
    where d.visa_type_id = vt.id and d.title = 'Proof of Eligibility'
  );
