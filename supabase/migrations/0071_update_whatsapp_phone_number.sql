-- Migration: 0071_update_whatsapp_phone_number.sql
-- Client's phone number changed to 0557329320 (UAE mobile). International
-- wa.me format: 971557329320 — country code 971, local number with its
-- leading 0 dropped (0557329320 -> 557329320), matching the exact pattern
-- already used for the previous number (0552276299 -> 971552276299).
--
-- whatsapp_settings is the one live, admin-editable phone number record
-- (Admin -> WhatsApp Templates) — see 0013_whatsapp_templates.sql /
-- 0014_seed_whatsapp_templates.sql. This is the only DB content record
-- that held the old number; every hardcoded occurrence in source
-- (lib/contact.ts, lib/whatsapp-templates.ts, and six components that
-- build their own wa.me links directly instead of going through
-- WhatsAppTemplatesProvider) was updated directly in code, not here.
--
-- Apply manually in Supabase SQL Editor.

update public.whatsapp_settings set phone_number = '971557329320' where id = 1;
