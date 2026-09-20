"use server";

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
