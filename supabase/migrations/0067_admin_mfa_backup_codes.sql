-- Migration: 0067_admin_mfa_backup_codes.sql
-- Backup codes for admin 2FA recovery (Password & 2FA admin screen). Supabase
-- Auth's MFA API doesn't provide backup codes natively, so this is a small,
-- self-contained addition: each row is one single-use recovery code, stored
-- as a SHA-256 hash (never plaintext) and scoped to the user who generated
-- it. "View Backup Codes" regenerates the set and shows the plaintext codes
-- once — same pattern GitHub/Google use, since a hash can't be reversed to
-- redisplay old codes.
--
-- Redeeming a backup code during sign-in (as an alternative to a TOTP code)
-- is a separate, bigger change to the login flow and is NOT built by this
-- migration or the Password & 2FA screen — this only covers generating and
-- displaying codes for the admin to save.
--
-- Apply manually in Supabase SQL Editor.

create table if not exists public.admin_mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_mfa_backup_codes_user_id on public.admin_mfa_backup_codes (user_id);

alter table public.admin_mfa_backup_codes enable row level security;

-- Self-service only: a signed-in admin can manage their own backup codes,
-- generated and viewed from their own authenticated session — no
-- service-role access needed for this table.
create policy "own_backup_codes_select" on public.admin_mfa_backup_codes
  for select using (user_id = auth.uid());
create policy "own_backup_codes_insert" on public.admin_mfa_backup_codes
  for insert with check (user_id = auth.uid());
create policy "own_backup_codes_delete" on public.admin_mfa_backup_codes
  for delete using (user_id = auth.uid());
