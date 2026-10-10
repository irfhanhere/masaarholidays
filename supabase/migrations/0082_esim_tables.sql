-- Migration: 0082_esim_tables.sql
-- Foundation tables for eSIM store integration via MegaEsim reseller API.
-- All tables have Row Level Security (RLS) enabled with NO public policies (service-role only access).

-- 1. esim_plans: Cached catalogue plans from MegaEsim
create table if not exists public.esim_plans (
  plan_id text primary key,
  plan_kind text not null default 'data',
  name text not null,
  country_iso text,
  region_slug text,
  data_gb numeric not null,
  validity_days integer not null,
  is_unlimited boolean not null default false,
  network_type text,
  carriers jsonb,
  fup_note text,
  supports_topup boolean not null default false,
  supports_cancel boolean not null default false,
  supports_hotspot boolean,
  ip_export text,
  retail_price_usd numeric(10, 2) not null,
  cost_usd numeric(10, 2) not null,
  sale_price_usd numeric(10, 2) not null,
  is_active boolean not null default true,
  raw jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists idx_esim_plans_country_iso on public.esim_plans(country_iso) where is_active = true;
create index if not exists idx_esim_plans_region_slug on public.esim_plans(region_slug) where is_active = true;
create index if not exists idx_esim_plans_is_active on public.esim_plans(is_active);

-- 2. esim_catalogue_meta: Singleton row tracking latest MegaEsim prices version and sync time
create table if not exists public.esim_catalogue_meta (
  id text primary key default 'singleton' check (id = 'singleton'),
  prices_version text,
  last_synced_at timestamptz
);

-- Seed initial singleton row
insert into public.esim_catalogue_meta (id, prices_version, last_synced_at)
values ('singleton', null, null)
on conflict (id) do nothing;

-- 3. esim_orders: Customer orders, payments, and MegaEsim fulfillment tracking
create table if not exists public.esim_orders (
  id uuid primary key default gen_random_uuid(),
  partner_ref text unique not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  plan_id text not null,
  quantity integer not null default 1,
  amount_usd numeric(10, 2),
  currency text not null default 'USD',
  payment_provider text,
  payment_ref text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  fulfilment_status text not null default 'pending' check (fulfilment_status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  megaesim_order_number text,
  megaesim_order_id text,
  esims jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_esim_orders_partner_ref on public.esim_orders(partner_ref);
create index if not exists idx_esim_orders_customer_email on public.esim_orders(customer_email);
create index if not exists idx_esim_orders_payment_status on public.esim_orders(payment_status);
create index if not exists idx_esim_orders_fulfilment_status on public.esim_orders(fulfilment_status);

-- 4. esim_webhook_events: Inbound webhook events ledger from MegaEsim & payment providers
create table if not exists public.esim_webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('megaesim', 'payment')),
  event text not null,
  payload jsonb not null,
  processed boolean not null default false,
  received_at timestamptz not null default now()
);

create index if not exists idx_esim_webhook_events_processed on public.esim_webhook_events(processed, received_at);
create index if not exists idx_esim_webhook_events_source on public.esim_webhook_events(source, event);

-- Enable Row Level Security (RLS) on all tables
-- With NO policies declared, public / anon / authenticated access is blocked.
-- Only the Supabase service_role key can access these tables.
alter table public.esim_plans enable row level security;
alter table public.esim_catalogue_meta enable row level security;
alter table public.esim_orders enable row level security;
alter table public.esim_webhook_events enable row level security;

comment on table public.esim_plans is 'Reseller eSIM catalogue plans synced from MegaEsim';
comment on table public.esim_catalogue_meta is 'Metadata tracking catalogue sync timestamp and prices version';
comment on table public.esim_orders is 'Customer purchases and MegaEsim order provisioning ledger';
comment on table public.esim_webhook_events is 'Webhook audit log for MegaEsim and payment provider notifications';
