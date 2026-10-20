-- Migration: 0091_visa_online_products_and_applications.sql
-- Supports the full Visa Redesign Online Application & Checkout system,
-- including online products/variants, applications, multi-traveller details,
-- private document attachments, and payment transaction reconciliation.

-- 1. Ensure service_mode and category exist on visa_types
alter table public.visa_types
  add column if not exists service_mode text not null default 'enquiry',
  add column if not exists category text not null default 'General',
  add column if not exists price_range text;

comment on column public.visa_types.service_mode is 'Either "online" (UAE, Saudi Tourist, US) or "enquiry" (Umrah, Global, Golden Visa, India)';
comment on column public.visa_types.category is 'Category badge e.g. UAE, Saudi Arabia, United States, Global, India';

-- Update initial service modes for existing types
update public.visa_types set service_mode = 'online', category = 'UAE', price_range = 'USD 90 - 140' where slug = 'uae';
update public.visa_types set service_mode = 'online', category = 'Saudi Arabia', price_range = 'USD 120 - 180' where slug = 'saudi-tourist';
update public.visa_types set service_mode = 'enquiry', category = 'Saudi Arabia', price_range = 'On Request' where slug = 'umrah';
update public.visa_types set service_mode = 'enquiry', category = 'Global', price_range = 'On Request' where slug = 'global';
update public.visa_types set service_mode = 'enquiry', category = 'UAE', price_range = 'On Request' where slug = 'golden-visa-assistance';
update public.visa_types set service_mode = 'enquiry', category = 'India', price_range = 'On Request' where slug = 'india';

-- Ensure US Visa type exists if not already present
insert into public.visa_types (slug, name, service_mode, category, price_range, description, hero_headline, hero_intro, is_active, display_order)
values (
  'us',
  'US Visa',
  'online',
  'United States',
  'USD 160 - 250',
  'B1/B2 tourist, business and student visa assistance with dedicated guidance.',
  'Apply for Your US Visa Online',
  'Get your US visa with guided appointment scheduling, document verification, and interview preparation.',
  true,
  3
)
on conflict (slug) do update set
  service_mode = 'online',
  category = 'United States',
  price_range = 'USD 160 - 250';

-- 2. Create visa_products table for online options and variants
create table if not exists public.visa_products (
  id uuid primary key default gen_random_uuid(),
  visa_type_slug text not null,
  title text not null,
  subtitle text,
  duration text not null,
  entry_type text not null,
  visa_fee_usd numeric(10,2) not null,
  service_fee_usd numeric(10,2) not null default 0,
  processing_fee_usd numeric(10,2) not null default 0,
  total_usd numeric(10,2) not null,
  currency text not null default 'USD',
  validity_days text,
  processing_time text default '3-5 Working Days',
  is_popular boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  inclusions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visa_products_slug on public.visa_products (visa_type_slug);
create index if not exists idx_visa_products_active on public.visa_products (is_active);

-- 3. Create visa_applications table
create table if not exists public.visa_applications (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  tracking_token text unique not null,
  visa_type_slug text not null,
  product_id uuid references public.visa_products(id),
  product_title text not null,
  applicant_count integer not null default 1,
  primary_contact_name text not null,
  primary_contact_email text not null,
  primary_contact_phone text not null,
  nationality text not null,
  country_of_residence text not null,
  travel_date text,
  purpose_of_visit text,
  duration_of_stay text,
  residential_address jsonb default '{}'::jsonb,
  fee_breakdown jsonb default '{}'::jsonb,
  total_amount numeric(10,2) not null,
  currency text not null default 'USD',
  payment_status text not null default 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_method text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  application_status text not null default 'submitted', -- 'draft', 'submitted', 'under_review', 'documents_required', 'submitted_to_authorities', 'approved', 'rejected', 'delivered'
  status_timeline jsonb not null default '[]'::jsonb,
  assigned_reviewer text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visa_applications_ref on public.visa_applications(reference_no);
create index if not exists idx_visa_applications_token on public.visa_applications(tracking_token);
create index if not exists idx_visa_applications_status on public.visa_applications(application_status);
create index if not exists idx_visa_applications_payment on public.visa_applications(payment_status);
create index if not exists idx_visa_applications_created on public.visa_applications(created_at desc);

-- 4. Create visa_applicants table
create table if not exists public.visa_applicants (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.visa_applications(id) on delete cascade,
  applicant_number integer not null default 1,
  full_name text not null,
  date_of_birth text not null,
  gender text not null,
  nationality text not null,
  country_of_residence text not null,
  passport_number text not null,
  passport_issue_date text not null,
  passport_expiry_date text not null,
  place_of_issue text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visa_applicants_app on public.visa_applicants(application_id);

-- 5. Create visa_application_documents table
create table if not exists public.visa_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.visa_applications(id) on delete cascade,
  applicant_id uuid references public.visa_applicants(id) on delete set null,
  document_type text not null,
  file_path text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  verification_status text not null default 'pending', -- 'pending', 'verified', 'rejected'
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visa_docs_app on public.visa_application_documents(application_id);

-- 6. Create visa_payments table
create table if not exists public.visa_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.visa_applications(id) on delete cascade,
  transaction_reference text not null,
  stripe_session_id text,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  payment_method text,
  payment_status text not null default 'pending',
  gateway text not null default 'stripe',
  gateway_payment_id text,
  refund_status text,
  refund_amount numeric(10,2),
  refund_date timestamptz,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visa_payments_app on public.visa_payments(application_id);
create index if not exists idx_visa_payments_tx on public.visa_payments(transaction_reference);

-- 7. Seed Initial Online Products
insert into public.visa_products (visa_type_slug, title, subtitle, duration, entry_type, visa_fee_usd, service_fee_usd, processing_fee_usd, total_usd, currency, validity_days, processing_time, is_popular, display_order, inclusions, exclusions)
values
  -- UAE Visa Products
  ('uae', '30 Days Single Entry', 'Standard UAE Visit Visa', '30 Days', 'Single', 90.00, 20.00, 10.00, 120.00, 'USD', '30 Days', '3-5 Working Days', true, 1, '["Single entry", "Valid for 30 days", "Tourism / Visit", "Fast processing"]'::jsonb, '["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"]'::jsonb),
  ('uae', '30 Days Multiple Entry', 'Multiple Entry Visit Visa', '30 Days', 'Multiple', 160.00, 25.00, 15.00, 200.00, 'USD', '30 Days', '3-5 Working Days', false, 2, '["Multiple entry", "Valid for 30 days", "Tourism / Visit", "Fast processing"]'::jsonb, '["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"]'::jsonb),
  ('uae', '60 Days Single Entry', 'Extended Stay Visit Visa', '60 Days', 'Single', 140.00, 25.00, 15.00, 180.00, 'USD', '60 Days', '3-5 Working Days', false, 3, '["Single entry", "Valid for 60 days", "Tourism / Visit", "Fast processing"]'::jsonb, '["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"]'::jsonb),
  ('uae', '60 Days Multiple Entry', 'Multiple Entry Extended Visa', '60 Days', 'Multiple', 210.00, 30.00, 20.00, 260.00, 'USD', '60 Days', '3-5 Working Days', false, 4, '["Multiple entry", "Valid for 60 days", "Tourism / Visit", "Fast processing"]'::jsonb, '["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"]'::jsonb),

  -- Saudi Tourist Visa Products
  ('saudi-tourist', '30 Days Single Entry', 'Saudi Tourist e-Visa', '30 Days', 'Single', 120.00, 20.00, 10.00, 150.00, 'USD', '30 Days', '1-3 Working Days', false, 1, '["Single entry", "Valid for 30 days", "Tourism / Leisure", "Fast digital issue"]'::jsonb, '["Flight tickets", "Hotel bookings", "Mandatory medical insurance if separate"]'::jsonb),
  ('saudi-tourist', '90 Days Multiple Entry', 'Multiple Entry Tourist Visa', '90 Days', 'Multiple', 180.00, 25.00, 15.00, 220.00, 'USD', '365 Days', '1-3 Working Days', true, 2, '["Multiple entry", "Valid for 1 Year", "Up to 90 days stay per visit", "Fast processing"]'::jsonb, '["Flight tickets", "Hotel bookings", "Overstay penalties"]'::jsonb),
  ('saudi-tourist', 'Transit Visa (96 Hours)', 'Stopover / Transit Visa', '96 Hours', 'Single', 80.00, 15.00, 10.00, 105.00, 'USD', '96 Hours', '24-48 Hours', false, 3, '["Single entry", "Valid for 96 hours", "Transit / Short stop", "Quick turnaround"]'::jsonb, '["Connecting flight ticket must be provided"]'::jsonb),
  ('saudi-tourist', 'Family Visit Visa', 'Family Visit (e-Visa)', '90 Days', 'Multiple', 200.00, 30.00, 20.00, 250.00, 'USD', '90 Days', '3-5 Working Days', false, 4, '["Family invitation required", "Guidance on MOFA platform", "Document verification"]'::jsonb, '["Flight tickets", "Accommodation"]'::jsonb),

  -- US Visa Products
  ('us', 'B1/B2 Tourist Visa', 'Business & Tourism', 'Varies', 'Single', 160.00, 25.00, 15.00, 200.00, 'USD', 'Up to 10 Years', 'Based on embassy appointment', true, 1, '["DS-160 guidance", "Appointment scheduling", "Document checklist", "Interview preparation"]'::jsonb, '["MRV fee if payable at bank", "Flight booking", "Hotel booking"]'::jsonb),
  ('us', 'Student Visa (F1)', 'Study in the United States', 'Varies', 'Single', 185.00, 25.00, 15.00, 225.00, 'USD', 'Course duration', 'Based on embassy appointment', false, 2, '["I-20 review", "SEVIS guidance", "DS-160 application", "Interview guidance"]'::jsonb, '["SEVIS I-901 fee", "Tuition fees"]'::jsonb),
  ('us', 'Business Visa (B1)', 'Business Travel', 'Varies', 'Single', 160.00, 25.00, 15.00, 200.00, 'USD', 'Up to 10 Years', 'Based on embassy appointment', false, 3, '["Corporate invitation review", "DS-160 assistance", "Appointment booking", "Interview prep"]'::jsonb, '["Travel tickets", "Conference fees"]'::jsonb),
  ('us', 'Work Visa (H1B)', 'Specialty Occupation', 'Varies', 'Single', 205.00, 25.00, 15.00, 245.00, 'USD', 'Petition duration', 'Based on USCIS & embassy', false, 4, '["I-797 review", "DS-160 filing", "Appointment booking", "Interview support"]'::jsonb, '["USCIS petition fee", "Travel costs"]'::jsonb)
on conflict do nothing;

-- 8. Enable Row Level Security
alter table public.visa_products enable row level security;
alter table public.visa_applications enable row level security;
alter table public.visa_applicants enable row level security;
alter table public.visa_application_documents enable row level security;
alter table public.visa_payments enable row level security;

-- Public read for active products
create policy "visa_products_public_select" on public.visa_products
  for select using (is_active = true or auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "visa_products_admin_all" on public.visa_products
  for all to authenticated using (true) with check (true);

-- Applications access: service_role or admin has full access
create policy "visa_applications_admin_all" on public.visa_applications
  for all using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "visa_applicants_admin_all" on public.visa_applicants
  for all using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "visa_application_docs_admin_all" on public.visa_application_documents
  for all using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "visa_payments_admin_all" on public.visa_payments
  for all using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- Notify PostgREST schema cache
notify pgrst, 'reload schema';
