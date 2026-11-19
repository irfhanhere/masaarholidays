-- Migration: 0103_tamara_payment_integration.sql
-- Integrates Tamara (Buy Now, Pay Later) Payment Gateway alongside Stripe and Tabby
-- Extends visa applications, visa payments, esim orders, and transfer bookings.

-- 1. Extend visa_applications table for Tamara
alter table public.visa_applications
  add column if not exists tamara_order_id text,
  add column if not exists tamara_checkout_id text;

-- Update payment_gateway check constraint to include 'tamara'
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'visa_applications_payment_gateway_check'
  ) then
    alter table public.visa_applications
      drop constraint visa_applications_payment_gateway_check;
  end if;

  alter table public.visa_applications
    add constraint visa_applications_payment_gateway_check
    check (payment_gateway in ('stripe', 'tabby', 'tamara', 'bank_transfer'));
end $$;

create index if not exists idx_visa_applications_tamara_id on public.visa_applications(tamara_order_id);

comment on column public.visa_applications.tamara_order_id is 'Tamara Order ID returned upon checkout creation';
comment on column public.visa_applications.tamara_checkout_id is 'Tamara Checkout Session ID';

-- 2. Extend visa_payments table for Tamara
alter table public.visa_payments
  add column if not exists tamara_order_id text,
  add column if not exists tamara_checkout_id text,
  add column if not exists tamara_capture_id text,
  add column if not exists tamara_refund_id text;

create index if not exists idx_visa_payments_tamara_id on public.visa_payments(tamara_order_id);

comment on column public.visa_payments.tamara_order_id is 'Tamara Order ID';
comment on column public.visa_payments.tamara_checkout_id is 'Tamara Checkout ID';
comment on column public.visa_payments.tamara_capture_id is 'Tamara Capture ID';
comment on column public.visa_payments.tamara_refund_id is 'Tamara Refund ID';

-- 3. Extend esim_orders table for Tamara
alter table public.esim_orders
  add column if not exists tamara_order_id text,
  add column if not exists tamara_checkout_id text,
  add column if not exists tamara_capture_id text,
  add column if not exists tamara_refund_id text;

create index if not exists idx_esim_orders_tamara_id on public.esim_orders(tamara_order_id);

comment on column public.esim_orders.tamara_order_id is 'Tamara Order ID for eSIM transactions';

-- 4. Extend transfer_bookings table for Tamara & multi-gateway support
alter table public.transfer_bookings
  add column if not exists payment_gateway text default 'stripe',
  add column if not exists tamara_order_id text,
  add column if not exists tamara_checkout_id text,
  add column if not exists tamara_capture_id text,
  add column if not exists tamara_refund_id text;

create index if not exists idx_transfer_bookings_tamara_id on public.transfer_bookings(tamara_order_id);
create index if not exists idx_transfer_bookings_gateway on public.transfer_bookings(payment_gateway);

comment on column public.transfer_bookings.payment_gateway is 'Payment gateway: stripe, tabby, or tamara';
comment on column public.transfer_bookings.tamara_order_id is 'Tamara Order ID for Transfer bookings';

-- Refresh schema cache
notify pgrst, 'reload schema';
