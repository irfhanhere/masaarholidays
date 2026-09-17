-- Admin-editable content for the /visa landing page's Important
-- Information + bottom CTA section (added after the initial Visa section
-- build — the landing page previously ended right after the 6-card grid).
--
-- No table currently backs any of /visa's page-level copy (its hero
-- headline/intro are hardcoded in src/app/(site)/visa/page.tsx, same as
-- most other top-level pages — home-about and page-seo are similarly
-- still hardcoded/stub, not a gap unique to visa). Rather than add another
-- hardcoded block, this follows the same singleton-row pattern already
-- established for whatsapp_settings (0013_whatsapp_templates.sql) — a
-- single row (id always 1), editable from a small admin screen.
create table public.visa_landing_content (
  id smallint primary key default 1,
  -- General, not-type-specific disclaimer — paragraphs separated by a
  -- blank line, same convention as visa_types.important_info_text.
  important_info_text text,
  cta_heading text,
  cta_line text,
  cta_note text,
  updated_at timestamptz not null default now(),
  constraint visa_landing_content_singleton check (id = 1)
);

create trigger visa_landing_content_set_updated_at
  before update on public.visa_landing_content
  for each row execute function public.set_updated_at();

alter table public.visa_landing_content enable row level security;

create policy "visa_landing_content_public_read" on public.visa_landing_content
  for select using (true);
create policy "visa_landing_content_admin_write" on public.visa_landing_content
  for all to authenticated using (true) with check (true);

insert into public.visa_landing_content (id) values (1) on conflict (id) do nothing;
