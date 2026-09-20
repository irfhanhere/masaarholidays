"use server";

import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export interface PasswordFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

const COMMON_PASSWORDS = new Set([
  "password", "password1", "12345678", "123456789", "qwerty123",
  "admin123", "letmein1", "welcome1", "iloveyou", "changeme1",
]);

function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("Password must be at least 8 characters.");
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) issues.push("Password must include letters and numbers.");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) issues.push("That password is too common — choose something less guessable.");
  return issues;
}

export async function updatePassword(
  _prevState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { status: "error", message: "All fields are required." };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: "New password and confirmation don't match." };
  }
  const issues = passwordIssues(newPassword);
  if (issues.length > 0) {
    return { status: "error", message: issues[0] };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { status: "error", message: "You must be signed in to change your password." };
  }

  // Supabase's updateUser() doesn't check the caller's current password on
  // its own — re-authenticating first is what actually enforces "Current
  // Password" as a real check, not just a form field.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { status: "error", message: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: "Your password has been updated." };
}

export interface MfaFactor {
  id: string;
  status: "verified" | "unverified";
  friendlyName: string | null;
}

export async function getMfaFactors(): Promise<MfaFactor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return [];
  return data.totp.map((f) => ({ id: f.id, status: f.status, friendlyName: f.friendly_name ?? null }));
}

export interface EnrollmentResult {
  status: "success" | "error";
  message?: string;
  factorId?: string;
  qrCodeSvg?: string;
  secret?: string;
}

export async function startMfaEnrollment(): Promise<EnrollmentResult> {
  const supabase = await createClient();

  // Clear any existing totp factor first — a previous incomplete enrollment
  // leaves an "unverified" one behind (piling up otherwise), and "Change
  // Method" calls this while a "verified" one is still active, which
  // Supabase's enroll() otherwise rejects outright ("factor ... already
  // exists") rather than replacing.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  const existingTotp = existing?.all.filter((f) => f.factor_type === "totp") ?? [];
  for (const f of existingTotp) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Masaar Holidays Admin",
  });
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Couldn't start 2FA enrollment." };
  }

  return {
    status: "success",
    factorId: data.id,
    qrCodeSvg: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyMfaEnrollment(factorId: string, code: string): Promise<PasswordFormState> {
  if (!/^\d{6}$/.test(code)) {
    return { status: "error", message: "Enter the 6-digit code from your authenticator app." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) {
    return { status: "error", message: "That code didn't match. Check your authenticator app and try again." };
  }

  return { status: "success", message: "Two-factor authentication is enabled." };
}

export async function disableMfa(factorId: string): Promise<PasswordFormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "success", message: "Two-factor authentication is disabled." };
}

export interface BackupCodesResult {
  status: "success" | "error";
  message?: string;
  codes?: string[];
}

function generateCode(): string {
  // 10 chars from an unambiguous alphabet (no 0/O/1/I/l) grouped as XXXXX-XXXXX.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(10);
  let raw = "";
  for (const b of bytes) raw += alphabet[b % alphabet.length];
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
}

/**
 * Regenerates the admin's backup codes, replacing any existing set — a
 * hash can't be reversed to redisplay old codes, so "View Backup Codes"
 * always means "generate a fresh set and show it once," same as
 * GitHub/Google. Redeeming a code during sign-in isn't built here; see the
 * migration's comment for why.
 */
export async function generateBackupCodes(): Promise<BackupCodesResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to generate backup codes." };
  }

  const codes = Array.from({ length: 8 }, generateCode);
  const rows = codes.map((code) => ({
    user_id: user.id,
    code_hash: crypto.createHash("sha256").update(code).digest("hex"),
  }));

  const { error: deleteError } = await supabase.from("admin_mfa_backup_codes").delete().eq("user_id", user.id);
  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  const { error: insertError } = await supabase.from("admin_mfa_backup_codes").insert(rows);
  if (insertError) {
    return { status: "error", message: insertError.message };
  }

  return { status: "success", codes };
}
