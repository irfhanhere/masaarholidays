-- WhatsApp message templates + destination number, moved out of
-- src/lib/whatsapp-templates.ts hardcoded constants and into the admin
-- WhatsApp Templates screen (previously scaffolded, not built out) per
-- brief Part 6: "Keep these editable in the admin's WhatsApp Templates
-- screen so Haseeb can adjust wording without a developer."
--
-- `key` is the stable code-side identifier every WhatsAppButton call site
-- references (see src/lib/whatsapp-templates.ts) — never rename an
-- existing key without updating every call site, since that's how the
-- public site finds the right row. `template_text` uses {{doubleBrace}}
-- placeholder tokens, matching ADMIN-WHATSAPP TEMPLATES.png exactly;
-- `placeholders` documents which tokens a given template actually uses,
-- for the admin UI's "Available Variables" hint.
create table public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  template_text text not null,
  placeholders text[] not null default '{}',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger whatsapp_templates_set_updated_at
  before update on public.whatsapp_templates
  for each row execute function public.set_updated_at();

-- Singleton row (id is always 1) for the wa.me destination number —
-- "+971 55 227 6299" today, editable from the same admin screen per the
-- brief. Stored without the leading "+", matching wa.me's expected format
-- (see lib/contact.ts#buildWhatsAppLink).
create table public.whatsapp_settings (
  id smallint primary key default 1,
  phone_number text not null,
  updated_at timestamptz not null default now(),
  constraint whatsapp_settings_singleton check (id = 1)
);

create trigger whatsapp_settings_set_updated_at
  before update on public.whatsapp_settings
  for each row execute function public.set_updated_at();

alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_settings enable row level security;

-- Public read is unconditional (not filtered on is_active): every key is
-- referenced by a required code path on the live site, so "Active" in
-- the admin UI is bookkeeping, not a visibility gate — a WhatsApp button
-- always needs *some* text, never nothing. See
-- lib/whatsapp-templates.ts for the hardcoded-default fallback used when
-- a key is missing entirely or the fetch fails.
create policy "whatsapp_templates_public_read" on public.whatsapp_templates
  for select using (true);
create policy "whatsapp_templates_admin_all" on public.whatsapp_templates
  for all to authenticated using (true) with check (true);

create policy "whatsapp_settings_public_read" on public.whatsapp_settings
  for select using (true);
create policy "whatsapp_settings_admin_write" on public.whatsapp_settings
  for update to authenticated using (true) with check (true);
