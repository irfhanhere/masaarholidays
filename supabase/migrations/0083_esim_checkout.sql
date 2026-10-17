-- Migration: 0083_esim_checkout.sql
-- Step 3 of 6: online checkout + Stripe payment integration.
-- Extends esim_orders with Stripe checkout session/payment intent tracking,
-- amounts in minor units (fils for AED), security tokens, and terms timestamp.
-- Adds external_id and unique constraint to esim_webhook_events for idempotent webhook processing.
-- RLS remains enabled with no public policies (service-role only).

create extension if not exists "pgcrypto";

-- 1. Extend esim_orders
alter table public.esim_orders
  add column if not exists public_token text not null default encode(gen_random_bytes(24), 'hex'),
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text,
  add column if not exists charged_amount_minor integer,
  add column if not exists expected_amount_minor integer,
  add column if not exists charge_currency text default 'aed',
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists fulfilment_error text,
  add column if not exists needs_attention boolean default false;

create unique index if not exists idx_esim_orders_public_token on public.esim_orders(public_token);
create unique index if not exists idx_esim_orders_stripe_session_id on public.esim_orders(stripe_session_id);

-- 2. Extend esim_webhook_events
alter table public.esim_webhook_events
  add column if not exists external_id text;

create unique index if not exists idx_esim_webhook_events_source_external_id on public.esim_webhook_events(source, external_id);

-- 3. Comments
comment on column public.esim_orders.public_token is 'Opaque URL safe token for customer facing status page (/esim/order/[token])';
comment on column public.esim_orders.stripe_session_id is 'Stripe Checkout Session ID (cs_...)';
comment on column public.esim_orders.stripe_payment_intent is 'Stripe Payment Intent ID (pi_...)';
comment on column public.esim_orders.charged_amount_minor is 'Actual charged amount in minor currency units (fils for AED)';
comment on column public.esim_orders.expected_amount_minor is 'Server calculated expected amount in minor currency units (fils for AED)';
comment on column public.esim_orders.charge_currency is 'Three-letter ISO currency code used for the Stripe charge (default: aed)';
comment on column public.esim_orders.terms_accepted_at is 'Timestamp when customer explicitly accepted terms, data-only notice, and refund policy';
comment on column public.esim_orders.needs_attention is 'Flagged true if payment mismatch, fulfillment anomaly, or human intervention needed';
comment on column public.esim_webhook_events.external_id is 'Provider event id (e.g. evt_... from Stripe) for idempotent webhook ingestion';
