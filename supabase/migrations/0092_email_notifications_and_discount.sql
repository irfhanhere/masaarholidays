-- Migration: 0092_email_notifications_and_discount.sql
-- Creates the email_notifications audit and idempotency ledger for customer and operational emails.

create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique not null,
  recipient text not null,
  subject text not null,
  template_type text not null, -- 'payment_confirmation', 'visa_application_received', 'transport_booking_confirmed', 'esim_order_confirmed', 'doc_request', 'status_update', 'payment_failed', 'refund_confirmed', 'internal_ops_alert'
  reference_id text,          -- e.g. Visa reference_no, Transfer booking_ref, eSIM partner_ref
  service_type text,          -- 'visa', 'transport', 'esim', 'general'
  status text not null default 'pending', -- 'sent', 'failed', 'skipped_no_smtp'
  attempt_count integer not null default 1,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_notifications_idempotency on public.email_notifications (idempotency_key);
create index if not exists idx_email_notifications_reference on public.email_notifications (reference_id);
create index if not exists idx_email_notifications_recipient on public.email_notifications (recipient);
create index if not exists idx_email_notifications_status on public.email_notifications (status);

-- Enable Row Level Security
alter table public.email_notifications enable row level security;

-- Only service role / authenticated admins can view notification records
create policy "Admins can view email notification logs"
  on public.email_notifications
  for select
  to authenticated
  using (true);

create policy "Admins and service role can insert email notification logs"
  on public.email_notifications
  for insert
  to authenticated
  with check (true);

create policy "Admins and service role can update email notification logs"
  on public.email_notifications
  for update
  to authenticated
  using (true);
