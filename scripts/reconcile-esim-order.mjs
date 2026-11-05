import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MEGAESIM_API_KEY = process.env.MEGAESIM_API_KEY;
const MEGAESIM_BASE_URL = process.env.MEGAESIM_BASE_URL || "https://megaesim.com/api/v1/partner";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.masaarholidays.com";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "care@masaarholidays.com";
const STAFF_ALERT_EMAIL = process.env.STAFF_ALERT_EMAIL || "care@masaarholidays.com";

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MEGAESIM_API_KEY) {
  console.error("Missing critical environment variables.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ORDER_REF = "MH-8RU6NX9YLC";
const ORDER_ID = "6c84a1b4-a755-4632-a740-bf3b0297a11e";

async function main() {
  console.log(`Starting authoritative reconciliation for order ${ORDER_REF} (${ORDER_ID})...`);

  // 1. Fetch current order from Supabase
  const { data: order, error: orderErr } = await supabase
    .from("esim_orders")
    .select("*")
    .eq("id", ORDER_ID)
    .single();

  if (orderErr || !order) {
    throw new Error(`Order not found in database: ${orderErr?.message}`);
  }

  console.log("Current DB Order Status:", {
    partner_ref: order.partner_ref,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    payment_status: order.payment_status,
    fulfilment_status: order.fulfilment_status,
    stripe_session_id: order.stripe_session_id,
  });

  // 2. Fetch Stripe Session & verify payment
  const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
  console.log("Authoritative Stripe Session:", {
    status: session.status,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_intent: session.payment_intent,
  });

  if (session.status !== "complete" || session.payment_status !== "paid") {
    throw new Error(`Stripe session is not paid (status: ${session.status}, payment_status: ${session.payment_status})`);
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  // 3. Update payment status to paid in Supabase
  if (order.payment_status !== "paid") {
    console.log("Updating order payment_status to 'paid'...");
    const { error: updatePayErr } = await supabase
      .from("esim_orders")
      .update({
        payment_status: "paid",
        payment_ref: paymentIntentId,
        stripe_payment_intent: paymentIntentId,
        charged_amount_minor: session.amount_total,
        charge_currency: session.currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updatePayErr) {
      throw new Error(`Failed to update payment status: ${updatePayErr.message}`);
    }
    console.log("Order payment status successfully updated to 'paid'.");
  } else {
    console.log("Order payment status was already 'paid'.");
  }

  // 4. Check if MegaEsim already has this order or if we need to call createOrder
  let megaOrder = null;
  console.log(`Checking / Creating MegaEsim order for ${ORDER_REF}...`);

  const orderPayload = {
    plan_id: order.plan_id,
    quantity: order.quantity || 1,
    partner_ref: order.partner_ref,
    end_user_email: order.customer_email || undefined,
  };

  const megaRes = await fetch(`${MEGAESIM_BASE_URL.replace(/\/+$/, "")}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MEGAESIM_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "MasaarHolidays/1.0",
    },
    body: JSON.stringify(orderPayload),
  });

  const megaData = await megaRes.json();
  console.log("MegaEsim API response status:", megaRes.status);

  if (!megaRes.ok) {
    console.error("MegaEsim API error details:", JSON.stringify(megaData, null, 2));
    throw new Error(`MegaEsim order provisioning failed: HTTP ${megaRes.status}`);
  }

  megaOrder = megaData;
  console.log("MegaEsim Order Created Successfully:", {
    id: megaOrder.id,
    order_number: megaOrder.order_number,
    status: megaOrder.status,
    esims_count: megaOrder.esims?.length || 0,
  });

  const esims = megaOrder.esims || [];
  const allUnitsReady =
    esims.length >= (order.quantity || 1) &&
    esims.every((unit) => unit.status === "ready" && unit.lpa && unit.qr_url);

  const fulfilmentStatus = allUnitsReady ? "completed" : "processing";

  // 5. Update Supabase with eSIM profiles
  console.log(`Updating Supabase with fulfilment_status: ${fulfilmentStatus}...`);
  const { error: esimSaveErr } = await supabase
    .from("esim_orders")
    .update({
      megaesim_order_number: megaOrder.order_number,
      megaesim_order_id: String(megaOrder.id),
      esims: esims,
      fulfilment_status: fulfilmentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (esimSaveErr) {
    throw new Error(`Failed to save eSIM profiles to database: ${esimSaveErr.message}`);
  }
  console.log("eSIM profiles saved to Supabase successfully.");

  // 6. Send Customer Delivery Email via Hostinger SMTP
  if (order.customer_email && esims.length > 0) {
    console.log(`Preparing delivery email for customer ${order.customer_email}...`);

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const orderUrl = `${SITE_URL}/esim/order/${order.public_token}`;
    const unitsHtml = esims
      .map((unit, idx) => {
        const appleInstallUrl = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(
          unit.lpa || ""
        )}`;
        const androidInstallUrl = `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(
          unit.lpa || ""
        )}`;

        return `
          <div style="border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px; margin-bottom: 24px; background: #ffffff;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0A0A08; font-weight: bold;">
              eSIM Profile ${idx + 1} of ${esims.length}
            </h3>

            <div style="text-align: center; margin: 20px 0;">
              <img src="${unit.qr_url}" alt="eSIM Activation QR Code" style="width: 220px; height: 220px; border: 4px solid #FAF7F2; border-radius: 12px; display: inline-block;" />
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #666666;">Scan using your smartphone camera or Cellular settings</p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${appleInstallUrl}" style="display: inline-block; background: #0A0A08; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: bold; margin: 4px 6px;">
                Direct Install on iPhone
              </a>
              <a href="${androidInstallUrl}" style="display: inline-block; background: #C9A227; color: #0A0A08; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: bold; margin: 4px 6px;">
                Direct Install on Android
              </a>
            </div>

            <div style="background: #FAF7F2; border: 1px solid #eee; border-radius: 8px; padding: 14px; margin-top: 16px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; color: #8F6407; font-weight: bold; margin-bottom: 4px;">
                Manual Activation Code (LPA String):
              </span>
              <code style="display: block; font-family: monospace; font-size: 12px; color: #0A0A08; word-break: break-all; background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #e0e0e0;">
                ${unit.lpa}
              </code>
              ${unit.iccid ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: #777777;">ICCID: ${unit.iccid}</p>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Travel eSIM is Ready - Masaar Holidays</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e5e5;">
          <div style="background-color: #0A0A08; padding: 32px; text-align: center;">
            <h1 style="color: #C9A227; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px;">MASAAR HOLIDAYS</h1>
            <p style="color: #A3A3A3; margin: 6px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Curated Umrah With Care</p>
          </div>
          <div style="padding: 32px;">
            <div style="display: inline-block; background: #E8F5E9; color: #2E7D32; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;">
              PAYMENT VERIFIED & PROVISIONED
            </div>
            <h2 style="color: #0A0A08; margin-top: 0; font-size: 22px;">Your Travel eSIM is Ready</h2>
            <p style="color: #4A4A48; font-size: 15px; line-height: 1.6;">
              Assalamu Alaikum ${order.customer_name || "Valued Guest"},<br><br>
              Thank you for choosing Masaar Holidays. Your high-speed travel eSIM for <strong>Saudi Arabia</strong> has been provisioned and is ready for immediate activation.
            </p>
            <div style="background: #FAF7F2; border-radius: 12px; padding: 18px; margin: 24px 0;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="color: #737373; padding: 4px 0;">Order Reference:</td>
                  <td style="color: #0A0A08; font-weight: bold; text-align: right;">${order.partner_ref}</td>
                </tr>
                <tr>
                  <td style="color: #737373; padding: 4px 0;">Plan:</td>
                  <td style="color: #0A0A08; font-weight: bold; text-align: right;">Unlimited 1-Day Data (Saudi Arabia)</td>
                </tr>
                <tr>
                  <td style="color: #737373; padding: 4px 0;">Total Paid:</td>
                  <td style="color: #0A0A08; font-weight: bold; text-align: right;">AED 11.16</td>
                </tr>
              </table>
            </div>

            ${unitsHtml}

            <div style="text-align: center; margin-top: 32px;">
              <a href="${orderUrl}" style="background-color: #0A0A08; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                View Live Order & Installation Guide
              </a>
            </div>

            <div style="border-top: 1px solid #eeeeee; margin-top: 32px; padding-top: 24px; font-size: 12px; color: #737373; line-height: 1.6;">
              <p><strong>Installation Tip:</strong> Install your eSIM over Wi-Fi before departure or upon arrival. Your validity will only start once connected to a local cellular network in Saudi Arabia.</p>
              <p>Need assistance? Contact our 24/7 concierge team in Dubai via WhatsApp at +971 52 361 7476 or email care@masaarholidays.com.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending email to ${order.customer_email}...`);
    const mailResult = await transporter.sendMail({
      from: `"Masaar Holidays" <${SMTP_FROM}>`,
      to: order.customer_email,
      cc: STAFF_ALERT_EMAIL,
      subject: `Your Travel eSIM is Ready — Order ${order.partner_ref}`,
      html: emailHtml,
    });

    console.log("Email dispatched successfully! MessageId:", mailResult.messageId);
  }

  console.log("\n=== RECONCILIATION SUMMARY ===");
  console.log(`Order Reference: ${order.partner_ref}`);
  console.log(`Customer: ${order.customer_name} (${order.customer_email})`);
  console.log(`Payment Intent: ${paymentIntentId}`);
  console.log(`MegaEsim Order Number: ${megaOrder?.order_number}`);
  console.log(`eSIM Profiles count: ${esims.length}`);
  if (esims[0]) {
    console.log(`ICCID: ${esims[0].iccid}`);
    console.log(`LPA: ${esims[0].lpa}`);
    console.log(`QR URL: ${esims[0].qr_url}`);
  }
  console.log("Status: COMPLETED & EMAILED TO CUSTOMER AND STAFF.");
}

main().catch((err) => {
  console.error("Reconciliation failed with error:", err);
  process.exit(1);
});

