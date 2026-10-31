/**
 * Production Environment Validator
 *
 * Runs once on server startup (via instrumentation.ts) to audit critical
 * production environment variables for payment, provisioning, security, and email dispatch.
 */

export const REQUIRED_PROD_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "MEGAESIM_API_KEY",
  "MEGAESIM_WEBHOOK_SECRET",
  "CRON_SECRET",
  "STAFF_ALERT_EMAIL",
  // SMTP variables read by lib/documents/mailer.ts
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
] as const;

export function validateProductionEnv(): {
  isValid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const varName of REQUIRED_PROD_ENV_VARS) {
    const val = process.env[varName];
    if (!val || val.trim().length === 0) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.warn(`
┌────────────────────────────────────────────────────────────────────────┐
│ ⚠️  [MASAAR CONFIG WARNING] Missing Production Environment Variables     │
├────────────────────────────────────────────────────────────────────────┤
│ The following ${missing.length} environment variables are not configured in this runtime:
${missing.map((v) => `│   • ${v}`).join("\n")}
│
│ Payments, carrier provisioning, background sweeps, or email delivery
│ will fail or degrade gracefully until these are configured.
└────────────────────────────────────────────────────────────────────────┘
`);
  } else {
    console.log("[MASAAR] All core production environment variables verified successfully.");
  }

  const tabbyConfigured = Boolean(process.env.TABBY_SECRET_KEY && process.env.TABBY_PUBLIC_KEY);
  if (!tabbyConfigured) {
    console.info("[MASAAR] Tabby BNPL: Operating in sandbox fallback mode (set TABBY_SECRET_KEY and TABBY_PUBLIC_KEY for live processing).");
  } else {
    console.log(`[MASAAR] Tabby BNPL: Configured in ${process.env.TABBY_ENVIRONMENT || "sandbox"} environment.`);
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}
