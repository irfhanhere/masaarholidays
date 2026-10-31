-- Migration: 0095_tabby_payment_integration.sql
-- Integrates Tabby (Pay in 4) Payment Gateway alongside Stripe
-- Supports UAE and Saudi Arabia Visa checkouts, server-side verification,
-- webhook idempotency, and admin reconciliation.

-- 1. Extend visa_applications table for Tabby & Multi-Gateway Support
alter table public.visa_applications
  add column if not exists payment_gateway text not null default 'stripe',
  add column if not exists tabby_payment_id text,
  add column if not exists tabby_session_id text,
  add column if not exists charged_currency text default 'USD',
  add column if not exists charged_amount numeric(10,2);

-- Check constraint on payment_gateway
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'visa_applications_payment_gateway_check'
  ) then
    alter table public.visa_applications
      add constraint visa_applications_payment_gateway_check
      check (payment_gateway in ('stripe', 'tabby', 'bank_transfer'));
  end if;
end $$;

-- Indexes for fast lookup by Tabby payment ID and gateway
create index if not exists idx_visa_applications_tabby_id on public.visa_applications(tabby_payment_id);
create index if not exists idx_visa_applications_gateway on public.visa_applications(payment_gateway);

comment on column public.visa_applications.payment_gateway is 'Active payment gateway: stripe or tabby';
comment on column public.visa_applications.tabby_payment_id is 'Tabby Payment ID (pay_...) returned upon authorization';
comment on column public.visa_applications.tabby_session_id is 'Tabby Checkout Session ID';
comment on column public.visa_applications.charged_currency is 'Actual currency charged to customer (AED, SAR, USD)';
comment on column public.visa_applications.charged_amount is 'Actual amount charged to customer in charged_currency';

-- 2. Extend visa_payments table for Tabby Transactions & Auditing
alter table public.visa_payments
  add column if not exists tabby_payment_id text,
  add column if not exists tabby_capture_id text,
  add column if not exists tabby_refund_id text,
  add column if not exists error_message text;

create index if not exists idx_visa_payments_tabby_id on public.visa_payments(tabby_payment_id);
create index if not exists idx_visa_payments_gateway on public.visa_payments(gateway);

comment on column public.visa_payments.tabby_payment_id is 'Tabby payment reference ID';
comment on column public.visa_payments.tabby_capture_id is 'Tabby capture transaction ID';
comment on column public.visa_payments.tabby_refund_id is 'Tabby refund transaction ID';
comment on column public.visa_payments.error_message is 'Error message or rejection reason if payment/refund failed';

-- 3. Create payment_webhook_events table for Idempotent Webhook Processing
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null, -- 'tabby', 'stripe'
  external_id text not null, -- provider event/payment ID
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

-- Unique index ensuring idempotent ingestion (no duplicate webhook executions)
create unique index if not exists idx_payment_webhook_events_gateway_ext_id
  on public.payment_webhook_events(gateway, external_id);

create index if not exists idx_payment_webhook_events_processed
  on public.payment_webhook_events(processed, created_at desc);

-- Enable Row Level Security
alter table public.payment_webhook_events enable row level security;

create policy "payment_webhook_events_admin_all" on public.payment_webhook_events
  for all using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

comment on table public.payment_webhook_events is 'Idempotent webhook event ledger for Tabby and Stripe payment updates';

-- Refresh schema cache
notify pgrst, 'reload schema';
