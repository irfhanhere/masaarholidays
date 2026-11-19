-- Migration: 0102_premium_package_addons.sql
-- Add addons jsonb column to premium_umrah_packages to support complimentary eSIM and optional add-ons (wheelchair assistance, private guide).

alter table if exists public.premium_umrah_packages
  add column if not exists addons jsonb not null default '[]'::jsonb;

-- Seed default addons into existing row if empty
update public.premium_umrah_packages
set addons = '[
  {
    "id": "addon-esim",
    "title": "Complimentary Saudi eSIM",
    "type": "complimentary",
    "description": "Provided complimentary for every pilgrim to ensure high-speed mobile data and connectivity upon landing in Saudi Arabia.",
    "badge": "Complimentary",
    "is_active": true
  },
  {
    "id": "addon-wheelchair",
    "title": "Wheelchair Assistance",
    "type": "upon_request",
    "description": "Dedicated wheelchair assistance and mobility support during Tawaf, Sa''i, and Haram visits available upon request for elderly pilgrims.",
    "badge": "Upon Request",
    "is_active": true
  },
  {
    "id": "addon-guide",
    "title": "Private Guide",
    "type": "upon_request",
    "description": "Dedicated 1-on-1 Umrah scholar or private guide available upon request for personalized ritual guidance and spiritual support.",
    "badge": "Upon Request",
    "is_active": true
  }
]'::jsonb
where slug = 'masaar-premium-umrah' and (addons is null or addons = '[]'::jsonb);
