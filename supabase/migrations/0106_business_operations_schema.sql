-- Migration: 0106_business_operations_schema.sql
-- Description: Central operations system schema for Customers, Travellers, Bookings, Payments, Suppliers, and Document Sequences.
-- Masaar Holidays: Faith, Clarity, Care, Peace.

-- 1. Document Sequences (Thread-safe sequential numbering)
create table if not exists public.document_sequences (
  id uuid primary key default gen_random_uuid(),
  document_type text not null, -- 'quotation', 'invoice', 'receipt', 'booking_voucher', 'booking', 'customer'
  prefix text not null,        -- 'MAS-QT', 'MAS-INV', 'MAS-RC', 'MAS-BV', 'MAS-BKG', 'MAS-CUS'
  year integer not null default extract(year from current_date)::integer,
  current_sequence integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_sequences_unique_type_year unique (document_type, year)
);

-- Sequence atomic increment function
create or replace function public.generate_next_document_number(
  p_doc_type text,
  p_year integer default extract(year from current_date)::integer
) returns text as $$
declare
  v_prefix text;
  v_seq integer;
  v_result text;
begin
  -- Resolve standard Masaar prefix
  case p_doc_type
    when 'quotation' then v_prefix := 'MAS-QT';
    when 'invoice' then v_prefix := 'MAS-INV';
    when 'receipt' then v_prefix := 'MAS-RC';
    when 'booking_voucher' then v_prefix := 'MAS-BV';
    when 'booking' then v_prefix := 'MAS-BKG';
    when 'customer' then v_prefix := 'MAS-CUS';
    else v_prefix := 'MAS-DOC';
  end case;

  -- Atomic upsert & increment
  insert into public.document_sequences (document_type, prefix, year, current_sequence)
  values (p_doc_type, v_prefix, p_year, 1)
  on conflict (document_type, year)
  do update set 
    current_sequence = document_sequences.current_sequence + 1,
    updated_at = now()
  returning current_sequence into v_seq;

  -- Format as MAS-XX-YYYY-0001
  if p_doc_type = 'customer' then
    v_result := v_prefix || '-' || lpad(v_seq::text, 4, '0');
  else
    v_result := v_prefix || '-' || p_year::text || '-' || lpad(v_seq::text, 4, '0');
  end if;

  return v_result;
end;
$$ language plpgsql security definer;


-- 2. Central Customer Management Table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_number text unique not null,
  full_name text not null,
  email text,
  phone text not null,
  whatsapp text,
  country text default 'United Arab Emirates',
  nationality text,
  address text,
  customer_type text not null default 'individual', -- 'individual', 'corporate', 'agent', 'vip'
  customer_source text not null default 'website',   -- 'website', 'whatsapp', 'referral', 'walk-in', 'phone', 'other'
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_full_name on public.customers(full_name);


-- 3. Travellers Table (Passenger details linked to customer / bookings)
create table if not exists public.travellers (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  full_name text not null, -- As per passport
  date_of_birth date,
  nationality text,
  passport_number text,
  passport_expiry date,
  gender text,             -- 'male', 'female'
  document_urls jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_travellers_customer_id on public.travellers(customer_id);
create index if not exists idx_travellers_passport on public.travellers(passport_number);


-- 4. Central Bookings Table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text unique not null,
  customer_id uuid references public.customers(id) on delete set null,
  quotation_id uuid references public.documents(id) on delete set null,
  package_id uuid,
  package_name text not null,
  room_category text,
  travel_date date,
  return_date date,
  adults integer not null default 1,
  children integer not null default 0,
  infants integer not null default 0,
  total_travellers integer not null default 1,
  departure_city text default 'Dubai',
  destination text default 'Makkah & Madinah',
  booking_status text not null default 'confirmed', -- 'enquiry', 'quotation_sent', 'awaiting_confirmation', 'confirmed', 'in_progress', 'documents_pending', 'completed', 'cancelled'
  payment_status text not null default 'unpaid',     -- 'unpaid', 'partially_paid', 'paid', 'refunded', 'partially_refunded'
  fulfilment_status text not null default 'pending',  -- 'pending', 'in_progress', 'completed', 'cancelled'
  currency text not null default 'AED',
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  assigned_staff text,
  internal_notes text,
  hotel_arrangements jsonb not null default '[]'::jsonb,
  flight_arrangements jsonb not null default '[]'::jsonb,
  transfer_arrangements jsonb not null default '[]'::jsonb,
  visa_arrangements jsonb not null default '[]'::jsonb,
  esim_arrangements jsonb not null default '[]'::jsonb,
  package_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_customer_id on public.bookings(customer_id);
create index if not exists idx_bookings_reference on public.bookings(booking_reference);
create index if not exists idx_bookings_status on public.bookings(booking_status);
create index if not exists idx_bookings_payment_status on public.bookings(payment_status);


-- 5. Suppliers Table
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null, -- 'hotel', 'airline', 'transport', 'visa', 'esim', 'tour', 'other'
  contact_person text,
  email text,
  phone text,
  address text,
  currency text not null default 'AED',
  payment_terms text,
  supplier_reference text,
  internal_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_suppliers_category on public.suppliers(category);


-- 6. Booking Supplier Costs (Cost ledger for profitability reporting)
create table if not exists public.booking_supplier_costs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  service_description text not null,
  estimated_cost numeric(12,2) not null default 0,
  actual_cost numeric(12,2) not null default 0,
  currency text not null default 'AED',
  payment_status text not null default 'unpaid', -- 'unpaid', 'partially_paid', 'paid'
  invoice_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_supplier_costs_booking on public.booking_supplier_costs(booking_id);


-- 7. Central Payments Table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_number text unique not null,
  receipt_id uuid references public.documents(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  invoice_id uuid references public.documents(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'AED',
  payment_method text not null, -- 'bank_transfer', 'cash', 'credit_card', 'stripe', 'tamara', 'cheque', 'other'
  payment_date date not null default current_date,
  transaction_reference text,
  received_by text,
  status text not null default 'confirmed', -- 'pending', 'confirmed', 'failed', 'refunded'
  notes text,
  gateway_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_booking_id on public.payments(booking_id);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);
create index if not exists idx_payments_customer_id on public.payments(customer_id);


-- 8. Alter documents table for operational linkages
alter table if exists public.documents
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists currency text default 'AED',
  add column if not exists exchange_rate numeric(10,4) default 1.0,
  add column if not exists exchange_rate_source text,
  add column if not exists voucher_type text default 'general',
  add column if not exists revision_number integer default 1,
  add column if not exists parent_quotation_id uuid references public.documents(id) on delete set null,
  add column if not exists price_override_reason text,
  add column if not exists price_override_by text,
  add column if not exists original_catalogue_price numeric(12,2),
  add column if not exists metadata jsonb default '{}'::jsonb;

-- RLS Policies
alter table public.customers enable row level security;
alter table public.travellers enable row level security;
alter table public.bookings enable row level security;
alter table public.suppliers enable row level security;
alter table public.booking_supplier_costs enable row level security;
alter table public.payments enable row level security;
alter table public.document_sequences enable row level security;

-- Admin write & read policies
create policy "admin_all_customers" on public.customers for all to authenticated using (true) with check (true);
create policy "admin_all_travellers" on public.travellers for all to authenticated using (true) with check (true);
create policy "admin_all_bookings" on public.bookings for all to authenticated using (true) with check (true);
create policy "admin_all_suppliers" on public.suppliers for all to authenticated using (true) with check (true);
create policy "admin_all_booking_supplier_costs" on public.booking_supplier_costs for all to authenticated using (true) with check (true);
create policy "admin_all_payments" on public.payments for all to authenticated using (true) with check (true);
create policy "admin_all_document_sequences" on public.document_sequences for all to authenticated using (true) with check (true);
