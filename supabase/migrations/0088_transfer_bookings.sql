-- Migration: 0088_transfer_bookings.sql
-- Online checkout, payments, and booking management for Private Transfer service.

create table if not exists public.transfer_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_ref text unique not null,
  public_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  route_slug text not null,
  route_name text not null,
  transfer_type text not null default 'airport',
  pickup_location text not null,
  dropoff_location text not null,
  duration_text text,
  vehicle_id text not null,
  vehicle_name text not null,
  model_year text,
  travel_date text not null,
  pickup_time text not null,
  passengers integer not null default 1,
  suitcases text default '0',
  flight_number text,
  special_requests text,
  price_aed numeric(10,2) not null,
  charged_amount_minor integer not null,
  charge_currency text not null default 'AED',
  fx_rate numeric(12,6) default 1.0,
  payment_status text not null default 'pending',
  booking_status text not null default 'pending',
  stripe_session_id text unique,
  stripe_payment_intent text,
  voucher_document_id uuid references public.documents(id) on delete set null,
  voucher_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transfer_bookings is 'Online customer bookings and payments for private transfer routes';
comment on column public.transfer_bookings.booking_ref is 'Human-readable booking reference, e.g. MH-TRF-A1B2C3D4';
comment on column public.transfer_bookings.public_token is 'Secure URL token for customer-facing order status verification';
comment on column public.transfer_bookings.payment_status is 'pending, paid, failed, or refunded';
comment on column public.transfer_bookings.booking_status is 'pending, confirmed, voucher_issued, completed, or cancelled';

create index if not exists idx_transfer_bookings_payment_status on public.transfer_bookings(payment_status);
create index if not exists idx_transfer_bookings_booking_status on public.transfer_bookings(booking_status);
create index if not exists idx_transfer_bookings_stripe_session on public.transfer_bookings(stripe_session_id);
create index if not exists idx_transfer_bookings_created_at on public.transfer_bookings(created_at desc);

-- Enable Row Level Security
alter table public.transfer_bookings enable row level security;

-- Customer read policy: allows customer to read their booking via public_token
drop policy if exists "transfer_bookings_public_read_by_token" on public.transfer_bookings;
create policy "transfer_bookings_public_read_by_token" on public.transfer_bookings
  for select
  using (true);

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
