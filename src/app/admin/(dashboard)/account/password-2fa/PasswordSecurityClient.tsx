"use client";

import { useActionState, useState } from "react";
import { Card, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import {
  disableMfa,
  generateBackupCodes,
  startMfaEnrollment,
  updatePassword,
  verifyMfaEnrollment,
  type MfaFactor,
  type PasswordFormState,
} from "./actions";

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

function ChangePasswordCard() {
  const [state, formAction, isPending] = useActionState<PasswordFormState, FormData>(updatePassword, initialPasswordState);
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const notCommon = newPassword.length === 0 || !COMMON_PASSWORDS.has(newPassword.toLowerCase());

  return (
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
  );
}

function TwoFactorCard({ initialFactors }: { initialFactors: MfaFactor[] }) {
  const verifiedFactor = initialFactors.find((f) => f.status === "verified") ?? null;
  const [factor, setFactor] = useState(verifiedFactor);
  const [enrolling, setEnrolling] = useState<{ factorId: string; qrCodeSvg: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  async function handleBeginEnroll() {
    setError(null);
    setNotice(null);
    setIsPending(true);
    try {
      const result = await startMfaEnrollment();
      if (result.status === "error" || !result.factorId || !result.qrCodeSvg || !result.secret) {
        setError(result.message ?? "Couldn't start enrollment.");
        return;
      }
      // startMfaEnrollment() already removed any prior factor server-side
      // (including a verified one, for "Change Method") — reflect that here
      // so the UI can't show "enabled" for a factor that no longer exists
      // if the user cancels this new enrollment instead of finishing it.
      setFactor(null);
      setEnrolling({ factorId: result.factorId, qrCodeSvg: result.qrCodeSvg, secret: result.secret });
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerify() {
    if (!enrolling) return;
    setError(null);
    setIsPending(true);
    try {
      const result = await verifyMfaEnrollment(enrolling.factorId, code);
      if (result.status === "error") {
        setError(result.message ?? "Verification failed.");
        return;
      }
      setFactor({ id: enrolling.factorId, status: "verified", friendlyName: null });
      setEnrolling(null);
      setCode("");
      setNotice(result.message ?? "Two-factor authentication is enabled.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDisable() {
    if (!factor) return;
    setError(null);
    setIsPending(true);
    try {
      const result = await disableMfa(factor.id);
      if (result.status === "error") {
        setError(result.message ?? "Couldn't disable 2FA.");
        return;
      }
      setFactor(null);
      setNotice(result.message ?? "Two-factor authentication is disabled.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleViewBackupCodes() {
    setError(null);
    setIsPending(true);
    try {
      const result = await generateBackupCodes();
      if (result.status === "error" || !result.codes) {
        setError(result.message ?? "Couldn't generate backup codes.");
        return;
      }
      setBackupCodes(result.codes);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">🛡️</span>
          <div>
            <h2 className="font-semibold text-masaar-black">Protect Your Account</h2>
            <p className="text-xs text-masaar-black/50">
              Two-factor authentication adds an extra layer of security by requiring a verification code in addition to your password.
            </p>
          </div>
        </div>
        {factor && (
          <button
            type="button"
            onClick={handleDisable}
            disabled={isPending}
            className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-emerald-600 transition-colors disabled:opacity-60"
            title="Click to disable 2FA"
          >
            <span className="inline-block size-5 translate-x-5 rounded-full bg-white transition-transform" />
          </button>
        )}
      </div>

      {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && !error && <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      {enrolling ? (
        <div>
          <p className="mb-3 text-sm font-medium text-masaar-black">Scan the QR code with your authenticator app</p>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <img
              src={enrolling.qrCodeSvg}
              alt="Scan this QR code with your authenticator app"
              className="size-40 shrink-0 rounded-md border border-black/10 bg-white p-2"
            />
            <div className="flex-1 space-y-2 text-sm text-masaar-black/70">
              <p><span className="font-semibold text-masaar-black">1.</span> Open your authenticator app</p>
              <p><span className="font-semibold text-masaar-black">2.</span> Scan this QR code</p>
              <p><span className="font-semibold text-masaar-black">3.</span> Enter the 6-digit code below to confirm</p>
              <p className="text-xs text-masaar-black/40">
                Can&apos;t scan? Enter this code manually: <code className="rounded bg-admin-surface px-1.5 py-0.5">{enrolling.secret}</code>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-masaar-black">Verification Code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className={`${inputClass} w-40 tracking-widest`}
              />
            </label>
            <PrimaryButton type="button" onClick={handleVerify} disabled={isPending || code.length !== 6}>
              {isPending ? "Verifying…" : "Verify & Enable"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => { setEnrolling(null); setCode(""); }} disabled={isPending}>
              Cancel
            </SecondaryButton>
          </div>
        </div>
      ) : factor ? (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-emerald-700">✅</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Two-factor authentication is enabled</p>
              <p className="text-xs text-emerald-700/80">Your account is now more secure.</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between rounded-md border border-black/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">📱</span>
              <div>
                <p className="text-sm font-semibold text-masaar-black">Authenticator App</p>
                <p className="text-xs text-masaar-black/50">Use an authenticator app (e.g. Google Authenticator, Microsoft Authenticator) to generate verification codes.</p>
              </div>
            </div>
            <SecondaryButton type="button" onClick={handleBeginEnroll} disabled={isPending}>Change Method</SecondaryButton>
          </div>

          <div className="flex items-center justify-between rounded-md border border-black/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">🔑</span>
              <div>
                <p className="text-sm font-semibold text-masaar-black">Backup Codes</p>
                <p className="text-xs text-masaar-black/50">Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
              </div>
            </div>
            <SecondaryButton type="button" onClick={handleViewBackupCodes} disabled={isPending}>View Backup Codes</SecondaryButton>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-dashed border-black/15 bg-warm-ivory/60 p-4">
          <p className="text-sm text-masaar-black/60">2FA is currently disabled for your account.</p>
          <PrimaryButton type="button" onClick={handleBeginEnroll} disabled={isPending}>
            {isPending ? "Starting…" : "Enable 2FA"}
          </PrimaryButton>
        </div>
      )}

      {backupCodes && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">Your Backup Codes</h3>
            <p className="mt-1 text-sm text-masaar-black/60">
              Save these somewhere safe — each code works once, and this is the only time they&apos;ll be shown. Generating new codes replaces these.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-admin-surface p-4 font-mono text-sm">
              {backupCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <PrimaryButton type="button" onClick={() => setBackupCodes(null)}>Done</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function PasswordSecurityClient({ initialFactors }: { initialFactors: MfaFactor[] }) {
  const [tab, setTab] = useState<"password" | "2fa">("password");

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs text-masaar-black/50">
          Dashboard <span className="mx-1">&rsaquo;</span> Settings <span className="mx-1">&rsaquo;</span> Security
        </p>
        <h1 className="text-2xl font-bold text-masaar-black">{tab === "password" ? "Change Password" : "Two-Factor Authentication (2FA)"}</h1>
        <p className="mt-1 text-sm text-masaar-black/60">
          {tab === "password" ? "Keep your account secure by using a strong, unique password." : "Add an extra layer of security to your account."}
        </p>
      </div>

      <div className="mb-6 flex border-b border-black/10">
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === "password" ? "border-deep-gold text-deep-gold" : "border-transparent text-masaar-black/50 hover:text-masaar-black"}`}
        >
          Change Password
        </button>
        <button
          type="button"
          onClick={() => setTab("2fa")}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === "2fa" ? "border-deep-gold text-deep-gold" : "border-transparent text-masaar-black/50 hover:text-masaar-black"}`}
        >
          Two-Factor Authentication
        </button>
      </div>

      {tab === "password" ? <ChangePasswordCard /> : <TwoFactorCard initialFactors={initialFactors} />}
    </div>
  );
}
