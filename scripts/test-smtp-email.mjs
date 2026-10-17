#!/usr/bin/env node
import nodemailer from "nodemailer";

/**
 * Test Hostinger SMTP delivery to STAFF_ALERT_EMAIL.
 * Strictly avoids logging or exposing SMTP_PASS or any credentials.
 */
async function run() {
  console.log("------------------------------------------------------------------");
  console.log("  Masaar Holidays — Hostinger SMTP Email Test");
  console.log("------------------------------------------------------------------");

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const configuredFrom = process.env.SMTP_FROM?.trim() || "care@masaarholidays.com";
  const rawStaff = process.env.STAFF_ALERT_EMAIL?.trim() || "care@masaarholidays.com";

  if (!host || !user || !pass) {
    console.error("❌ FAILED: Missing SMTP configuration in environment.");
    console.error("   Required variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
    console.error("   Optional variables: SMTP_FROM, STAFF_ALERT_EMAIL");
    process.exit(1);
  }

  const staffEmails = rawStaff
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isSecure = port === 465;

  console.log(`• Host: ${host}`);
  console.log(`• Port: ${port}`);
  console.log(`• Secure (SSL): ${isSecure} (STARTTLS mode: ${!isSecure})`);
  console.log(`• Auth User: ${user}`);
  console.log(`• From: Masaar Holidays <${configuredFrom}>`);
  console.log(`• Recipients (STAFF_ALERT_EMAIL): ${staffEmails.join(", ")}`);
  console.log("------------------------------------------------------------------");
  console.log("Connecting and sending test message...");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
  });

  const subject = `[SMTP TEST] Masaar Holidays Email Delivery Verification — ${new Date().toISOString()}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; padding: 24px; background: #FAF7F2; border: 1px solid #e0d8cc; border-radius: 12px; color: #0A0A08;">
      <h2 style="color: #8F6407; margin-top: 0;">Masaar Holidays — SMTP Configuration Test</h2>
      <p style="font-size: 14px; line-height: 1.6;">This is a test notification confirming that transactional email delivery is functioning via Hostinger SMTP.</p>
      <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e8e8e8; font-size: 13px; line-height: 1.5; margin: 16px 0;">
        <div><strong>Server Host:</strong> ${host}</div>
        <div><strong>Port:</strong> ${port} (${isSecure ? "SSL/TLS Direct" : "STARTTLS"})</div>
        <div><strong>Sender:</strong> ${configuredFrom}</div>
        <div><strong>Dispatched At:</strong> ${new Date().toUTCString()}</div>
      </div>
      <p style="font-size: 12px; color: #666666; margin-bottom: 0;">If you received this message, staff alert and customer order delivery emails are operational.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `Masaar Holidays <${configuredFrom}>`,
      to: staffEmails.join(", "),
      subject,
      html,
    });

    console.log("✅ SUCCESS: Test email dispatched successfully!");
    console.log(`• Message ID: ${info.messageId}`);
    if (info.accepted && info.accepted.length > 0) {
      console.log(`• Accepted recipients: ${info.accepted.join(", ")}`);
    }
    if (info.response) {
      console.log(`• Server response: ${info.response}`);
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ FAILED: SMTP delivery encountered an error.");
    if (err && typeof err === "object") {
      const { code, command, response, responseCode, message } = err;
      console.error(`• Error Code: ${code || "UNKNOWN"}`);
      if (command) console.error(`• Failed Command: ${command}`);
      if (responseCode) console.error(`• Response Code: ${responseCode}`);
      if (response) console.error(`• SMTP Server Response: ${response}`);
      console.error(`• Details: ${message}`);
    } else {
      console.error("• Details:", String(err));
    }
    process.exit(1);
  }
}

run();
