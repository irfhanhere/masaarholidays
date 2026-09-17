-- Admin-editable content for the Home page's bottom CTA bar's supporting
-- Qur'an quote. No table currently backs any Home page copy (it's all
-- hardcoded, most of it still literally "Copy pending" placeholders) —
-- same singleton-row pattern already established for
-- visa_landing_content (0024_visa_landing_content.sql) and, before that,
-- whatsapp_settings.
--
-- Originally also carried Founder's Note + Vision & Mission fields, but
-- that section was cut from the Home page before this migration was ever
-- applied — edited in place here rather than shipping a create-then-drop
-- pair, since 0029 never went live with the wider shape.
create table public.home_content (
  id smallint primary key default 1,
  cta_quote_text text,
  cta_quote_reference text,
  updated_at timestamptz not null default now(),
  constraint home_content_singleton check (id = 1)
);

create trigger home_content_set_updated_at
  before update on public.home_content
  for each row execute function public.set_updated_at();

alter table public.home_content enable row level security;

create policy "home_content_public_read" on public.home_content
  for select using (true);
create policy "home_content_admin_write" on public.home_content
  for all to authenticated using (true) with check (true);

insert into public.home_content (id) values (1) on conflict (id) do nothing;
