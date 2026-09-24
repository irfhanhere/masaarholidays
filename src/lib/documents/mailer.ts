import "server-only";
import nodemailer from "nodemailer";

/**
 * SMTP sending via an existing Masaar mailbox (e.g. care@masaarholidays.com)
 * rather than a third-party provider — no account to set up, but nothing
 * works until these are set in the environment. Every call site should
 * expect sendDocumentEmail to throw a clear, user-facing message when
 * unconfigured rather than a raw nodemailer stack trace.
 */
function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export interface SendDocumentEmailInput {
  to: string;
  cc?: string;
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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    cc: input.cc || undefined,
    subject: input.subject,
    html: input.html,
    attachments: input.attachment ? [{ filename: input.attachment.filename, content: input.attachment.content }] : undefined,
  });
}
