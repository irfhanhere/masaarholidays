-- Migration: 0087_esim_fx_rates.sql
-- Step 4.4: Dedicated eSIM exchange rates table
-- Decouples eSIM charging rates from the shared package currency_rates table.
-- Provides pegged rates for AED (3.6725), SAR (3.75), and USD (1.0),
-- and daily refreshed floating rates for EUR, GBP, and INR.

create table if not exists public.esim_fx_rates (
  currency text primary key,
  usd_rate numeric(12,6) not null,
  source text not null default 'initial',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.esim_fx_rates is 'Dedicated exchange rates for eSIM multi-currency checkout (1 USD = X currency)';
comment on column public.esim_fx_rates.currency is 'ISO 4217 currency code (AED, USD, EUR, GBP, SAR, INR)';
comment on column public.esim_fx_rates.usd_rate is 'Exchange rate against 1 USD (raw market rate)';
comment on column public.esim_fx_rates.source is 'Source of the rate: pegged, open.er-api.com, exchangerate-api, or manual';
comment on column public.esim_fx_rates.fetched_at is 'Timestamp when the rate was fetched or updated from the upstream source';

-- Enable Row Level Security
alter table public.esim_fx_rates enable row level security;

-- Public read access for client and frontend rate conversion
drop policy if exists "esim_fx_rates_public_read" on public.esim_fx_rates;
create policy "esim_fx_rates_public_read" on public.esim_fx_rates
  for select using (true);

-- Service role full access for refresh cron and admin operations
drop policy if exists "esim_fx_rates_service_role" on public.esim_fx_rates;
create policy "esim_fx_rates_service_role" on public.esim_fx_rates
  for all using (auth.role() = 'service_role');

-- Seed initial accurate rates
insert into public.esim_fx_rates (currency, usd_rate, source, fetched_at)
values
  ('AED', 3.672500, 'pegged', now()),
  ('SAR', 3.750000, 'pegged', now()),
  ('USD', 1.000000, 'pegged', now()),
  ('EUR', 0.889517, 'open.er-api.com', now()),
  ('GBP', 0.750839, 'open.er-api.com', now()),
  ('INR', 95.111965, 'open.er-api.com', now())
on conflict (currency) do update set
  usd_rate = excluded.usd_rate,
  source = excluded.source,
  fetched_at = excluded.fetched_at,
  updated_at = now();

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
