-- Migration: 0086_esim_multi_currency_checkout.sql
-- Step 4.3: Multi-currency checkout, FX rate recording, and PostgREST schema cache reload.
-- Allows direct charging in AED, USD, EUR, GBP, SAR, and INR.

alter table public.esim_orders
  add column if not exists charge_currency text default 'aed',
  add column if not exists expected_amount_minor integer,
  add column if not exists fx_rate numeric(12,6),
  add column if not exists fx_rate_at timestamptz,
  add column if not exists presentment_currency text,
  add column if not exists presentment_amount_minor integer,
  add column if not exists vat_amount_minor integer default 0,
  add column if not exists vat_rate_pct numeric(5,2) default 5.00,
  add column if not exists vat_trn text,
  add column if not exists invoice_number text;

comment on column public.esim_orders.charge_currency is 'ISO currency code charged via Stripe (e.g. aed, usd, eur, gbp, sar, inr)';
comment on column public.esim_orders.expected_amount_minor is 'Expected amount to collect in minor units of charge_currency';
comment on column public.esim_orders.fx_rate is 'Exchange rate applied from USD base price to charge_currency';
comment on column public.esim_orders.fx_rate_at is 'Timestamp when the exchange rate was fetched';
comment on column public.esim_orders.vat_amount_minor is 'VAT portion of charged_amount_minor in minor units when ESIM_VAT_ENABLED is active';

-- Force PostgREST to reload its schema cache immediately so newly added columns are discoverable
notify pgrst, 'reload schema';
