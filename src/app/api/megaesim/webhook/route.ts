import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendCustomerDeliveryEmail,
  refundStripeOrder,
} from "@/lib/esim-fulfilment";
import { sendDocumentEmail, getStaffAlertEmails } from "@/lib/documents/mailer";
import type { Esim } from "@/lib/megaesim";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Verifies X-MegaEsim-Signature header:
 * Format: 'sha256=' + hex HMAC-SHA256 of raw request body
 */
function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "sha256") {
    return false;
  }

  const providedHex = parts[1].trim().toLowerCase();
  const calculatedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")
    .toLowerCase();

  if (providedHex.length !== calculatedHex.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(providedHex, "hex"), Buffer.from(calculatedHex, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.MEGAESIM_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("MegaEsim webhook received but MEGAESIM_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "MegaEsim webhook secret is not configured on server" },
      { status: 500 }
    );
  }

  const signatureHeader =
    request.headers.get("x-megaesim-signature") ||
    request.headers.get("X-MegaEsim-Signature");

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  if (!verifySignature(rawBody, signatureHeader, webhookSecret)) {
    console.warn("Invalid MegaEsim webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const eventName = (body.event || body.type || "unknown") as string;
  const externalId = (body.id || body.event_id || `${eventName}_${body.data?.partner_ref || body.data?.order_id || Date.now()}`) as string;

  const supabase = createAdminClient();

  // Log to esim_webhook_events (idempotent: return 200 on duplicate)
  const { error: insertErr } = await supabase.from("esim_webhook_events").insert({
    source: "megaesim",
    external_id: externalId,
    event: eventName,
    payload: body,
    processed: false,
  });

  if (insertErr) {
    const isDuplicate =
      insertErr.code === "23505" ||
      insertErr.message.toLowerCase().includes("duplicate") ||
      insertErr.message.toLowerCase().includes("unique");

    if (isDuplicate) {
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
    }

    console.error("Failed to insert MegaEsim webhook event:", insertErr.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Heavy lifting executed; respond within 8s
  const data = body.data || body.payload || {};

  try {
    switch (eventName) {
      case "esim.ready": {
        // e.g. { partner_ref, order_number, iccid, lpa, qr_url, status: "ready" }
        const partnerRef = data.partner_ref;
        const orderNumber = data.order_number;

        let query = supabase.from("esim_orders").select("*");
        if (partnerRef) {
          query = query.eq("partner_ref", partnerRef);
        } else if (orderNumber) {
          query = query.eq("megaesim_order_number", orderNumber);
        } else {
          break;
        }

        const { data: order } = await query.maybeSingle();
        if (!order) break;

        const currentEsims: Esim[] = Array.isArray(order.esims) ? (order.esims as Esim[]) : [];
        const updatedEsims = [...currentEsims];

        // Find or update matching unit
        const incomingIccid = data.iccid;
        const incomingLpa = data.lpa;
        const incomingQr = data.qr_url;

        let matched = false;
        for (let i = 0; i < updatedEsims.length; i++) {
          if (
            (incomingIccid && updatedEsims[i].iccid === incomingIccid) ||
            (!updatedEsims[i].lpa && updatedEsims[i].status !== "ready")
          ) {
            updatedEsims[i] = {
              ...updatedEsims[i],
              iccid: incomingIccid || updatedEsims[i].iccid,
              lpa: incomingLpa || updatedEsims[i].lpa,
              qr_url: incomingQr || updatedEsims[i].qr_url,
              status: "ready",
            };
            matched = true;
            break;
          }
        }

        if (!matched && (incomingLpa || incomingQr)) {
          updatedEsims.push({
            iccid: incomingIccid || "",
            lpa: incomingLpa || "",
            qr_url: incomingQr || "",
            status: "ready",
            expires_at: data.expires_at || null,
          });
        }

        // Check if all units are ready
        const allReady =
          updatedEsims.length >= (order.quantity || 1) &&
          updatedEsims.every((u) => u.status === "ready" && u.lpa && u.qr_url);

        const newStatus = allReady ? "completed" : "processing";

        await supabase
          .from("esim_orders")
          .update({
            esims: updatedEsims as unknown as Record<string, unknown>,
            fulfilment_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        // If newly completed, send delivery email
        if (allReady && order.fulfilment_status !== "completed") {
          await sendCustomerDeliveryEmail(order, updatedEsims);
        }
        break;
      }

      case "order.failed": {
        // Provider confirmed order failed permanently
        const partnerRef = data.partner_ref;
        if (partnerRef) {
          const { data: order } = await supabase
            .from("esim_orders")
            .select("*")
            .eq("partner_ref", partnerRef)
            .maybeSingle();

          if (order) {
            await supabase
              .from("esim_orders")
              .update({
                fulfilment_status: "failed",
                fulfilment_error: data.reason || "Provider reported order failure.",
                needs_attention: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            // Execute automatic Stripe refund
            await refundStripeOrder(order);
          }
        }
        break;
      }

      case "wallet.low_balance": {
        // Alert staff
        const staffEmails = getStaffAlertEmails();
        const balance = data.balance ?? data.wallet_balance;
        const currency = data.currency ?? "USD";

        try {
          await sendDocumentEmail({
            to: staffEmails,
            subject: `[ALERT] MegaEsim Low Wallet Balance (${currency} ${balance})`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #c9a227;">MegaEsim Wallet Balance Alert</h2>
                <p>Your MegaEsim reseller account wallet balance is low.</p>
                <p><strong>Current Balance:</strong> ${currency} ${balance}</p>
                <p>Please top up your wallet in the MegaEsim partner dashboard to prevent eSIM provisioning interruptions.</p>
              </div>
            `,
          });
        } catch (mailErr) {
          console.warn("Failed to send wallet.low_balance alert:", mailErr);
        }
        break;
      }

      case "esim.installed":
      case "esim.active":
      case "esim.expired":
      case "esim.cancelled":
      case "esim.revoked": {
        // Record profile lifecycle status in esims array
        const iccid = data.iccid;
        const partnerRef = data.partner_ref;

        if (iccid && partnerRef) {
          const { data: order } = await supabase
            .from("esim_orders")
            .select("id, esims")
            .eq("partner_ref", partnerRef)
            .maybeSingle();

          if (order && Array.isArray(order.esims)) {
            const esims = (order.esims as Esim[]).map((e) =>
              e.iccid === iccid ? { ...e, status: eventName.replace("esim.", "") } : e
            );
            await supabase
              .from("esim_orders")
              .update({
                esims: esims as unknown as Record<string, unknown>,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          }
        }
        break;
      }

      default:
        // Ignore unknown events
        break;
    }

    // Mark event processed
    await supabase
      .from("esim_webhook_events")
      .update({ processed: true })
      .eq("source", "megaesim")
      .eq("external_id", externalId);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Processing error";
    console.error("Error executing MegaEsim webhook actions:", msg);
    return NextResponse.json({ received: true, error: msg }, { status: 200 });
  }
}
