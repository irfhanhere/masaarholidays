-- Admin-editable meta title/description/OG image/noindex for the site's
-- static top-level pages — replaces the "Page SEO" admin stub, which had
-- no backing table at all (values lived hardcoded in each page's
-- generateMetadata call). Keyed by path since these are one-per-route,
-- singleton-ish rows, not a bigger content model like visa_landing_content.
--
-- Dynamic content (packages/hotels/visa_types/umrah_departure_months)
-- does NOT live here — see 0034_dynamic_content_seo_fields.sql, which
-- adds meta_title/meta_description directly to each of those tables
-- instead, per the explicit instruction not to build a second, parallel
-- SEO system for content that already has its own admin form.
create table public.page_seo (
  path text primary key, -- e.g. "/", "/umrah", "/about" — locale-independent, matches buildPageMetadata's `path` param
  meta_title text not null,
  meta_description text,
  og_image_url text,
  noindex boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger page_seo_set_updated_at
  before update on public.page_seo
  for each row execute function public.set_updated_at();

alter table public.page_seo enable row level security;

create policy "page_seo_public_read" on public.page_seo
  for select using (true);
create policy "page_seo_admin_all" on public.page_seo
  for all to authenticated using (true) with check (true);

-- Seeds real, page-specific copy (not "Page | Masaar Holidays" filler) —
-- mostly lifted verbatim from what each page's generateMetadata already
-- hardcoded, since that copy was already well-written; this just moves
-- it into an editable row instead of duplicating/replacing it blindly.
insert into public.page_seo (path, meta_title, meta_description) values
  ('/', 'Umrah Travel Agency UAE | Masaar Holidays',
    'Masaar Holidays plans private, family-paced Umrah journeys from the UAE — personalised support, curated accommodation, and one dedicated point of contact throughout.'),
  ('/umrah', 'Umrah Packages UAE | Masaar Holidays',
    'Umrah packages from the UAE, thoughtfully planned around your family — accommodation, transfers and personal support at every level of comfort.'),
  ('/hajj', 'Hajj Packages UAE | Masaar Holidays',
    'Hajj packages from the UAE with clear accommodation, transfers and guidance — planned around your family, not manufactured urgency.'),
  ('/hotels', 'Makkah & Madinah Hotels | Masaar Holidays',
    'Hotels in Makkah and Madinah selected for Haram proximity, comfort, and family suitability — standalone or as part of your Umrah/Hajj package.'),
  ('/transfers', 'Private Umrah Transfers | Masaar Holidays',
    'Private transfers for your Umrah journey — Jeddah and Madinah airports, the Haramain train, and intercity routes, arranged as part of the care of the journey.'),
  ('/visa', 'Visa & Document Assistance | Masaar Holidays',
    'From pilgrimage visas to international travel documentation, Masaar Holidays helps you understand the requirements, prepare the necessary documents and navigate the application process with greater clarity.'),
  ('/about', 'About Masaar Holidays | Family-Focused Umrah Travel',
    'Masaar Holidays is an Umrah travel company serving families from the UAE with thoughtfully planned journeys, personal support and considered arrangements.'),
  ('/contact', 'Contact Masaar Holidays | Umrah & Hajj Enquiries',
    'Reach Masaar Holidays by WhatsApp, phone, or email — a dedicated advisor responds personally to every Umrah or Hajj enquiry.')
on conflict (path) do nothing;
