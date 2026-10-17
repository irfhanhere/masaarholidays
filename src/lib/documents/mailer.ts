import "server-only";
import nodemailer from "nodemailer";
import { CONTACT } from "@/lib/contact";

/**
 * SMTP sending via an existing Masaar mailbox (e.g. care@masaarholidays.com)
 * rather than a third-party provider — no account to set up, but nothing
 * works until these are set in the environment. Every call site should
 * expect sendDocumentEmail to throw a clear, user-facing message when
 * unconfigured rather than a raw nodemailer stack trace.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

if (process.env.NODE_ENV === "production" && !isSmtpConfigured()) {
  console.warn(
    "[STARTUP WARNING] SMTP credentials are not configured in production! Transactional customer delivery emails will fail to send. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM."
  );
}

/**
 * Returns a validated Masaar mailbox address for SMTP_FROM.
 * Always resolves to a Masaar mailbox (defaults to care@masaarholidays.com).
 */
export function getMasaarFromAddress(): string {
  const custom = process.env.SMTP_FROM?.trim();
  if (custom && custom.includes("@")) {
    return custom;
  }
  return CONTACT.emailGeneral;
}

/**
 * Returns a list of staff alert email addresses from STAFF_ALERT_EMAIL (supports comma-separated values).
 */
export function getStaffAlertEmails(): string[] {
  const raw = process.env.STAFF_ALERT_EMAIL?.trim();
  if (!raw) return [CONTACT.emailGeneral];
  const emails = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return emails.length > 0 ? emails : [CONTACT.emailGeneral];
}

export interface SendDocumentEmailInput {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachment?: { filename: string; content: Buffer };
}

export async function sendDocumentEmail(input: SendDocumentEmailInput): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new Error(
      "Email sending isn't configured yet — add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM to your environment (your existing care@masaarholidays.com mailbox's SMTP details), then restart the app."
    );
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure, // true when SMTP_PORT is 465, STARTTLS otherwise
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const fromAddress = getMasaarFromAddress();
  const formattedFrom = fromAddress.includes("<")
    ? fromAddress
    : `Masaar Holidays <${fromAddress}>`;

  const to = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  const cc = Array.isArray(input.cc) ? input.cc.join(", ") : input.cc;

  await transporter.sendMail({
    from: formattedFrom,
    to,
    cc: cc || undefined,
    subject: input.subject,
    html: input.html,
    attachments: input.attachment
      ? [{ filename: input.attachment.filename, content: input.attachment.content }]
      : undefined,
  });
}

