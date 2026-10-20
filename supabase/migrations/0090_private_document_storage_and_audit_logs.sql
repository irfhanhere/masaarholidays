-- Migration: 0090_private_document_storage_and_audit_logs.sql
-- Configures private document storage for client passports, visa documents,
-- and travel vouchers, plus admin audit logging for sensitive actions.

-- 1. Create or update private_documents storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private_documents',
  'private_documents',
  false,
  26214400, -- 25 MB max file size
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400;

-- 2. Row Level Security policies for private storage objects
-- Only authenticated staff (or service_role) may read, upload, or manage private documents
drop policy if exists "private_documents_admin_select" on storage.objects;
create policy "private_documents_admin_select" on storage.objects
  for select
  using (
    bucket_id = 'private_documents'
    and (auth.role() = 'authenticated' or auth.role() = 'service_role')
  );

drop policy if exists "private_documents_admin_insert" on storage.objects;
create policy "private_documents_admin_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'private_documents'
    and (auth.role() = 'authenticated' or auth.role() = 'service_role')
  );

drop policy if exists "private_documents_admin_update" on storage.objects;
create policy "private_documents_admin_update" on storage.objects
  for update
  using (
    bucket_id = 'private_documents'
    and (auth.role() = 'authenticated' or auth.role() = 'service_role')
  );

drop policy if exists "private_documents_admin_delete" on storage.objects;
create policy "private_documents_admin_delete" on storage.objects
  for delete
  using (
    bucket_id = 'private_documents'
    and (auth.role() = 'authenticated' or auth.role() = 'service_role')
  );

-- 3. Admin audit logging table
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  admin_email text not null,
  action text not null, -- e.g. 'visa.update', 'document.issue', 'payment.record', 'refund.issue'
  resource_type text not null, -- 'visa_type', 'document', 'esim_order', 'transfer_booking', 'setting'
  resource_id text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is 'Audit trail of administrative actions, visa configuration edits, document operations, and refunds.';
comment on column public.admin_audit_logs.admin_email is 'Email address of the authenticated admin executing the action';
comment on column public.admin_audit_logs.action is 'Normalized verb indicating operation performed';
comment on column public.admin_audit_logs.details is 'Structured metadata, changes, and before/after values';

create index if not exists idx_admin_audit_logs_action on public.admin_audit_logs(action);
create index if not exists idx_admin_audit_logs_resource on public.admin_audit_logs(resource_type, resource_id);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_logs_admin_email on public.admin_audit_logs(admin_email);

-- Enable RLS
alter table public.admin_audit_logs enable row level security;

-- Read policy: staff only
drop policy if exists "admin_audit_logs_select" on public.admin_audit_logs;
create policy "admin_audit_logs_select" on public.admin_audit_logs
  for select
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- Insert policy: staff only
drop policy if exists "admin_audit_logs_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_insert" on public.admin_audit_logs
  for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- Notify schema cache
notify pgrst, 'reload schema';
