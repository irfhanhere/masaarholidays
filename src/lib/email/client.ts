import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT } from "@/lib/contact";

/**
 * Hostinger SMTP Client & Delivery Engine
 *
 * Configured specifically for:
 * - Hostname: smtp.hostinger.com
 * - Port: 465
 * - Security: SSL/TLS (direct TLS, secure: true)
 * - User: care@masaarholidays.com
 * - From: Masaar Holidays <care@masaarholidays.com>
 *
 * Privacy & Security:
 * - Passwords and keys are never logged or exposed.
 * - If SMTP_PASS is missing, emails are marked as skipped and logged safely
 *   without crashing ongoing checkouts or webhooks.
 */

let cachedTransporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_PASS.trim().length > 0
  );
}

export function getMasaarFromEmail(): string {
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || "care@masaarholidays.com";
  const fromName = process.env.MAIL_FROM_NAME || "Masaar Holidays";
  return `"${fromName}" <${fromEmail}>`;
}

export function getStaffRecipientEmail(): string {
  return process.env.STAFF_ALERT_EMAIL || "care@masaarholidays.com";
}

/**
 * Returns a configured nodemailer transporter with direct TLS on port 465.
 */
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const port = Number(process.env.SMTP_PORT) || 465;
  const isSecure = process.env.SMTP_SECURE === "true" || port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port,
    secure: isSecure, // Port 465 direct SSL/TLS
    auth: {
      user: process.env.SMTP_USER || "care@masaarholidays.com",
      pass: process.env.SMTP_PASS || "",
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
  });

  return cachedTransporter;
}

/**
 * Tests connection to Hostinger SMTP. Safe for health checks.
 */
export async function verifySmtpConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!isSmtpConfigured()) {
    return {
      ok: false,
      message:
        "SMTP password (SMTP_PASS) is missing or empty. Please set the mailbox password in environment configuration.",
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { ok: true, message: "Hostinger SMTP connected and authenticated successfully." };
  } catch (err: unknown) {
    const safeError = err instanceof Error ? err.message : String(err);
    console.error("[SMTP] Connection verification failed:", safeError);
    return { ok: false, message: `SMTP verification failed: ${safeError}` };
  }
}

export interface SendMailOptions {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Sends a transactional email. If SMTP is unconfigured, skips safely.
 */
export async function sendEmail(options: SendMailOptions): Promise<SendMailResult> {
  if (!isSmtpConfigured()) {
    console.warn(
      `[SMTP] Delivery skipped for "${options.subject}" to ${Array.isArray(options.to) ? options.to.join(",") : options.to}. Reason: SMTP_PASS is not configured.`
    );
    return {
      success: false,
      skipped: true,
      error: "SMTP is not configured on this environment (SMTP_PASS missing).",
    };
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: getMasaarFromEmail(),
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SMTP] Error dispatching email to ${options.to}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export interface IdempotentEmailOptions extends SendMailOptions {
  idempotencyKey: string;
  templateType: string;
  referenceId?: string;
  serviceType?: "visa" | "transport" | "esim" | "general";
  metadata?: Record<string, unknown>;
}

/**
 * Idempotently delivers an email, checking the email_notifications table.
 * If the idempotencyKey has already succeeded, duplicate sends are prevented.
 */
export async function sendIdempotentEmail(
  options: IdempotentEmailOptions
): Promise<SendMailResult & { duplicate?: boolean }> {
  const supabase = createAdminClient();
  const recipient = Array.isArray(options.to) ? options.to.join(", ") : options.to;

  // 1. Check if already delivered
  try {
    const { data: existing } = await supabase
      .from("email_notifications")
      .select("id, status")
      .eq("idempotency_key", options.idempotencyKey)
      .maybeSingle();

    if (existing && existing.status === "sent") {
      console.log(`[SMTP-Idempotency] Duplicate suppressed for key: ${options.idempotencyKey}`);
      return { success: true, duplicate: true };
    }
  } catch (checkErr) {
    console.warn("[SMTP-Idempotency] Note: Check error, proceeding to attempt send:", checkErr);
  }

  // 2. Dispatch email
  const sendResult = await sendEmail(options);

  // 3. Log notification status
  try {
    const notificationStatus = sendResult.success
      ? "sent"
      : sendResult.skipped
      ? "skipped_no_smtp"
      : "failed";

    await supabase.from("email_notifications").upsert(
      {
        idempotency_key: options.idempotencyKey,
        recipient,
        subject: options.subject,
        template_type: options.templateType,
        reference_id: options.referenceId || null,
        service_type: options.serviceType || "general",
        status: notificationStatus,
        error_message: sendResult.error || null,
        metadata: options.metadata || {},
        sent_at: sendResult.success ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "idempotency_key" }
    );
  } catch (logErr) {
    console.error("[SMTP-Idempotency] Error recording in email_notifications:", logErr);
  }

  return sendResult;
}
