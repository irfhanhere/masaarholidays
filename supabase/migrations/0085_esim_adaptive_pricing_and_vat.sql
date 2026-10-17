-- Migration: 0085_esim_adaptive_pricing_and_vat.sql
-- Step 4.2: Adaptive Pricing and VAT support for eSIM orders.
-- Supports international multi-currency presentment (e.g. INR, USD) while maintaining AED settlement,
-- and adds structural VAT fields (disabled by default via ESIM_VAT_ENABLED switch).

alter table public.esim_orders
  add column if not exists presentment_currency text,
  add column if not exists presentment_amount_minor integer,
  add column if not exists vat_amount_minor integer default 0,
  add column if not exists vat_rate_pct numeric(5,2) default 5.00,
  add column if not exists vat_trn text,
  add column if not exists invoice_number text;

comment on column public.esim_orders.presentment_currency is 'Local currency presented to and paid by the customer via Stripe Adaptive Pricing (e.g. inr, usd, eur, gbp)';
comment on column public.esim_orders.presentment_amount_minor is 'Amount paid by customer in presentment_currency in minor units (e.g. paise/cents)';
comment on column public.esim_orders.vat_amount_minor is 'VAT portion of charged_amount_minor in fils when ESIM_VAT_ENABLED is active (price is VAT-inclusive)';
comment on column public.esim_orders.vat_rate_pct is 'VAT percentage applied when order was placed (e.g. 5.00)';
comment on column public.esim_orders.vat_trn is 'UAE Tax Registration Number (TRN) recorded at time of transaction';
comment on column public.esim_orders.invoice_number is 'Standardized Tax Invoice or Receipt reference generated via document system';
