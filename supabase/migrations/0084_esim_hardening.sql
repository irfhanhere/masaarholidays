-- Migration: 0084_esim_hardening.sql
-- Step 4.1: Hardening before go-live.
-- Adds sweep tracking to esim_orders and supports 'abandoned' payment status.

-- 1. Extend esim_orders payment_status check constraint to include 'abandoned'
alter table public.esim_orders
  drop constraint if exists esim_orders_payment_status_check;

alter table public.esim_orders
  add constraint esim_orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'abandoned'));

-- 2. Add sweep_count for monitoring stuck orders in /api/esim/sweep
alter table public.esim_orders
  add column if not exists sweep_count integer not null default 0,
  add column if not exists refund_notes text;

-- 3. Composite indexes for high-efficiency cron sweeps and status checks
create index if not exists idx_esim_orders_sweep_pending
  on public.esim_orders(payment_status, fulfilment_status, created_at);

create index if not exists idx_esim_orders_sweep_processing
  on public.esim_orders(fulfilment_status, updated_at);

comment on column public.esim_orders.sweep_count is 'Count of sweep passes executed for this order when pending or processing';
comment on column public.esim_orders.refund_notes is 'Audit trail of refund steps, unit cancellations, and any admin override reasons';
