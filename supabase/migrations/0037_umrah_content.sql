-- Singleton table for /umrah page editable content, starting with Guided Umrah Assistance
create table if not exists public.umrah_content (
  id smallint primary key default 1,
  
  -- Guided Umrah Assistance section
  guided_assistance_eyebrow text default 'RITUAL GUIDANCE',
  guided_assistance_heading text default 'Guided Umrah Assistance',
  guided_assistance_duration text default '~3-4 hours (full ritual coverage)',
  guided_assistance_description text default 'Step-by-step spiritual and practical accompaniment through your Umrah rituals, ensuring peace of mind and strict adherence to the Sunnah.',
  
  -- Feature lines: jsonb array of { title, description }
  guided_assistance_features jsonb not null default '[
    {"title": "Sunnah-Guided", "description": "Step-by-step guidance strictly according to Sunnah"},
    {"title": "Side-by-Side Support", "description": "Accompanies you through Tawaf, Sa''ai, and prayers"},
    {"title": "Recitation Support", "description": "Helps lead and recite supplications (duas) throughout"}
  ]'::jsonb,

  -- Feature pills/badges: jsonb array of string
  guided_assistance_badges jsonb not null default '[
    "Personal & Dedicated Guide",
    "Authentic Sunnah Guidance",
    "End-to-End Ritual Companion (3-4 Hours)"
  ]'::jsonb,

  guided_assistance_whatsapp_template_key text default 'guidedUmrah',

  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint umrah_content_singleton check (id = 1)
);

create trigger umrah_content_set_updated_at
  before update on public.umrah_content
  for each row execute function public.set_updated_at();

alter table public.umrah_content enable row level security;

create policy "umrah_content_public_read" on public.umrah_content
  for select using (true);
create policy "umrah_content_admin_write" on public.umrah_content
  for all to authenticated using (true) with check (true);

-- Seed default singleton row
insert into public.umrah_content (
  id,
  guided_assistance_eyebrow,
  guided_assistance_heading,
  guided_assistance_duration,
  guided_assistance_description,
  guided_assistance_features,
  guided_assistance_badges,
  guided_assistance_whatsapp_template_key,
  is_active
) values (
  1,
  'RITUAL GUIDANCE',
  'Guided Umrah Assistance',
  '~3-4 hours (full ritual coverage)',
  'Step-by-step spiritual and practical accompaniment through your Umrah rituals, ensuring peace of mind and strict adherence to the Sunnah.',
  '[
    {"title": "Sunnah-Guided", "description": "Step-by-step guidance strictly according to Sunnah"},
    {"title": "Side-by-Side Support", "description": "Accompanies you through Tawaf, Sa''ai, and prayers"},
    {"title": "Recitation Support", "description": "Helps lead and recite supplications (duas) throughout"}
  ]'::jsonb,
  '[
    "Personal & Dedicated Guide",
    "Authentic Sunnah Guidance",
    "End-to-End Ritual Companion (3-4 Hours)"
  ]'::jsonb,
  'guidedUmrah',
  true
) on conflict (id) do nothing;

-- Seed WhatsApp template for Guided Umrah
insert into public.whatsapp_templates (key, label, template_text, placeholders, display_order)
values (
  'guidedUmrah',
  'Umrah — Guided Assistance Enquiry',
  'Assalamu Alaikum, I''d like to enquire about the Guided Umrah Assistance service.',
  array[]::text[],
  15
)
on conflict (key) do update set
  label = excluded.label,
  template_text = excluded.template_text,
  placeholders = excluded.placeholders,
  display_order = excluded.display_order;
