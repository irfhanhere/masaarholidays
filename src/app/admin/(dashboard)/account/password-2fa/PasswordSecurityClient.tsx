"use client";

import { useActionState, useState } from "react";
import { Card, PrimaryButton, inputClass } from "@/components/admin/ui";
import { updatePassword, type PasswordFormState } from "./actions";

const initialPasswordState: PasswordFormState = { status: "idle" };

function ChecklistItem({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${met ? "text-emerald-700" : "text-masaar-black/50"}`}>
      <span className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] ${met ? "bg-emerald-100 text-emerald-700" : "bg-black/5 text-masaar-black/30"}`}>
        {met ? "✓" : "○"}
      </span>
      {children}
    </li>
  );
}

const COMMON_PASSWORDS = new Set([
  "password", "password1", "12345678", "123456789", "qwerty123",
  "admin123", "letmein1", "welcome1", "iloveyou", "changeme1",
]);

export function PasswordSecurityClient() {
  const [state, formAction, isPending] = useActionState<PasswordFormState, FormData>(updatePassword, initialPasswordState);
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const notCommon = newPassword.length === 0 || !COMMON_PASSWORDS.has(newPassword.toLowerCase());

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs text-masaar-black/50">
          Dashboard <span className="mx-1">&rsaquo;</span> Settings <span className="mx-1">&rsaquo;</span> Security
        </p>
        <h1 className="text-2xl font-bold text-masaar-black">Change Password</h1>
        <p className="mt-1 text-sm text-masaar-black/60">Keep your account secure by using a strong, unique password.</p>
      </div>

      <Card className="max-w-xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">🔒</span>
          <div>
            <h2 className="font-semibold text-masaar-black">Update Your Password</h2>
            <p className="text-xs text-masaar-black/50">Your new password will be used to access the admin panel.</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-masaar-black">Current Password <span className="text-red-500">*</span></span>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                name="current_password"
                required
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-masaar-black/40 hover:text-masaar-black">
                👁
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-masaar-black">New Password <span className="text-red-500">*</span></span>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                name="new_password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-masaar-black/40 hover:text-masaar-black">
                👁
              </button>
            </div>
          </label>

          <div className="rounded-md bg-admin-surface p-3">
            <p className="mb-2 text-xs font-semibold text-masaar-black">Use a strong password:</p>
            <ul className="space-y-1.5">
              <ChecklistItem met={hasLength}>At least 8 characters</ChecklistItem>
              <ChecklistItem met={hasLettersAndNumbers}>Include letters and numbers</ChecklistItem>
              <ChecklistItem met={notCommon}>Avoid common words</ChecklistItem>
            </ul>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-masaar-black">Confirm New Password <span className="text-red-500">*</span></span>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirm_password"
                required
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-masaar-black/40 hover:text-masaar-black">
                👁
              </button>
            </div>
          </label>

          {state.status === "error" && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
          )}
          {state.status === "success" && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>
          )}

          <PrimaryButton type="submit" disabled={isPending} className="w-full justify-center">
            🔒 {isPending ? "Updating…" : "Update Password"}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
