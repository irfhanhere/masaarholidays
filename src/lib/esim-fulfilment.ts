import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder, cancelEsim, getOrderByRef, MegaEsimError, type Order, type Esim } from "@/lib/megaesim";
import { getStripe } from "@/lib/stripe";
import { getSiteOrigin } from "@/lib/site-url";
import { sendDocumentEmail, isSmtpConfigured, getStaffAlertEmails } from "@/lib/documents/mailer";
import { buildWhatsAppLink } from "@/lib/contact";

/**
 * eSIM Order Fulfilment Engine (Step 4 of 6)
 *
 * Implements automated provisioning via MegaEsim reseller API after Stripe payment:
 * 1. Claims order atomically to prevent duplicate fulfilment.
 * 2. Invokes MegaEsim createOrder with backoff retry (using the SAME partner_ref).
 * 3. Updates order status and saves eSIM profiles (ICCID, LPA, QR).
 * 4. Dispatches branded customer delivery email with QR and LPA fallback.
 * 5. Handles provider errors: flags needs_attention, alerts staff, and executes
 *    automatic Stripe refunds only when MegaEsim confirms order failure.
 */

interface ClaimedOrder {
  id: string;
  partner_ref: string;
  plan_id: string;
  quantity: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  stripe_payment_intent: string | null;
  stripe_session_id: string | null;
  expected_amount_minor: number | null;
  charged_amount_minor?: number | null;
  charge_currency?: string | null;
  presentment_currency?: string | null;
  presentment_amount_minor?: number | null;
  vat_amount_minor?: number | null;
  vat_rate_pct?: number | null;
  vat_trn?: string | null;
  invoice_number?: string | null;
  public_token: string;
}

/**
 * Atomically claims the order and initiates MegaEsim provisioning.
 */
export async function fulfilEsimOrder(orderId: string): Promise<void> {
  const supabase = createAdminClient();

  // Step 1: Atomically claim the order (prevents double fulfilment)
  const { data: order, error: claimErr } = await supabase
    .from("esim_orders")
    .update({
      fulfilment_status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", "paid")
    .eq("fulfilment_status", "pending")
    .select(
      "id, partner_ref, plan_id, quantity, customer_name, customer_email, customer_phone, stripe_payment_intent, stripe_session_id, expected_amount_minor, charged_amount_minor, charge_currency, presentment_currency, presentment_amount_minor, vat_amount_minor, vat_rate_pct, vat_trn, invoice_number, public_token"
    )
    .maybeSingle();

  if (claimErr) {
    console.error(`Failed to claim order ${orderId} for fulfilment:`, claimErr.message);
    return;
  }

  if (!order) {
    // Order already claimed, completed, or not in paid+pending state
    console.log(`[esim-fulfilment] Order ${orderId} is not in pending fulfilment state. Skipping.`);
    return;
  }

  await processFulfilment(order);
}

/**
 * Manually retries fulfilment for an existing order (used by admin dashboard).
 */
export async function retryFulfilEsimOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: order, error: fetchErr } = await supabase
    .from("esim_orders")
    .select(
      "id, partner_ref, plan_id, quantity, customer_name, customer_email, customer_phone, stripe_payment_intent, stripe_session_id, expected_amount_minor, charged_amount_minor, charge_currency, presentment_currency, presentment_amount_minor, vat_amount_minor, vat_rate_pct, vat_trn, invoice_number, public_token, payment_status, fulfilment_status"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    return { success: false, error: "Order not found." };
  }

  if (order.payment_status !== "paid") {
    return { success: false, error: "Cannot fulfil an unpaid order." };
  }

  // Set to processing
  await supabase
    .from("esim_orders")
    .update({
      fulfilment_status: "processing",
      fulfilment_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  try {
    await processFulfilment(order);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Retry failed";
    return { success: false, error: msg };
  }
}

/**
 * Internal execution flow for provisioning and dispatch.
 */
async function processFulfilment(order: ClaimedOrder): Promise<void> {
  const supabase = createAdminClient();
  const maxRetries = 3;
  let orderResult: Order | null = null;
  let lastError: Error | null = null;

  // Step 2: Call MegaEsim createOrder with backoff retry using the SAME partner_ref
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      orderResult = await createOrder({
        planId: order.plan_id,
        quantity: order.quantity || 1,
        partnerRef: order.partner_ref,
        endUserEmail: order.customer_email || undefined,
      });
      break; // Success
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isMegaError = err instanceof MegaEsimError;
      const status = isMegaError ? err.httpStatus : 500;
      const code = isMegaError ? err.code : "network_error";

      console.warn(
        `[esim-fulfilment] Attempt ${attempt}/${maxRetries} failed for order ${order.id} (${order.partner_ref}): [${code}] ${lastError.message}`
      );

      // Only retry timeouts, network errors, 500, or 502
      const isRetryable =
        code === "timeout" ||
        code === "network_error" ||
        status === 500 ||
        status === 502 ||
        status === 408;

      if (isRetryable && attempt < maxRetries) {
        // Exponential backoff: 1.5s, 3s
        const backoffMs = attempt * 1500;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        // Non-retryable error (e.g. 402 insufficient_balance, 422 plan_unavailable) or out of retries
        break;
      }
    }
  }

  // Step 3: Handle outcome
  if (!orderResult) {
    const errorMsg = lastError?.message || "MegaEsim order creation failed after retries.";

    // Update order with needs_attention = true, store fulfilment_error, KEEP customer payment intact
    await supabase
      .from("esim_orders")
      .update({
        fulfilment_status: "failed",
        fulfilment_error: errorMsg,
        needs_attention: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // Alert staff via email and log
    await alertStaffProvisioningIssue({
      order,
      errorMsg,
      code: lastError instanceof MegaEsimError ? lastError.code : "unknown_failure",
    });

    return;
  }

  // Check if MegaEsim confirmed order failed or refunded immediately
  if (orderResult.status === "provisioning_failed" || orderResult.status === "refunded") {
    console.warn(
      `[esim-fulfilment] MegaEsim confirmed order failure (${orderResult.status}) for ${order.partner_ref}. Triggering automatic Stripe refund.`
    );

    await supabase
      .from("esim_orders")
      .update({
        megaesim_order_number: orderResult.order_number,
        megaesim_order_id: String(orderResult.id),
        esims: (orderResult.esims || []) as unknown as Record<string, unknown>,
        fulfilment_status: "failed",
        fulfilment_error: `Provider marked order as ${orderResult.status}`,
        needs_attention: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // Issue automatic full Stripe refund
    await refundStripeOrder(order);

    // Send customer refund notice email
    await sendCustomerRefundEmail(order);

    // Alert staff
    await alertStaffProvisioningIssue({
      order,
      errorMsg: `MegaEsim rejected order (${orderResult.status}). Customer automatically refunded.`,
      code: orderResult.status,
    });

    return;
  }

  // Check if all units are ready
  const esims = orderResult.esims || [];
  const allUnitsReady =
    esims.length >= (order.quantity || 1) &&
    esims.every((unit) => unit.status === "ready" && unit.lpa && unit.qr_url);

  const fulfilmentStatus = allUnitsReady ? "completed" : "processing";

  // Persist MegaEsim order details
  await supabase
    .from("esim_orders")
    .update({
      megaesim_order_number: orderResult.order_number,
      megaesim_order_id: String(orderResult.id),
      esims: esims as unknown as Record<string, unknown>,
      fulfilment_status: fulfilmentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  console.log(
    `[esim-fulfilment] Order ${order.id} updated to status: ${fulfilmentStatus} (${esims.length} profiles).`
  );

  // If completed, ensure receipt/invoice number is assigned if VAT is enabled
  if (allUnitsReady) {
    if (order.vat_amount_minor && order.vat_amount_minor > 0 && !order.invoice_number) {
      try {
        const { data: numRes } = await supabase.rpc("generate_document_number", {
          p_document_type: "receipt",
        });
        if (typeof numRes === "string" && numRes.trim().length > 0) {
          order.invoice_number = numRes.trim();
          await supabase
            .from("esim_orders")
            .update({ invoice_number: order.invoice_number })
            .eq("id", order.id);
        }
      } catch (rpcErr) {
        console.warn("[esim-fulfilment] Could not assign receipt number via RPC:", rpcErr);
      }
    }
    await sendCustomerDeliveryEmail(order, esims);
  }
}

export interface RefundEsimOrderOptions {
  orderId: string;
  adminEmail?: string;
  overrideNote?: string;
}

export interface RefundEsimOrderResult {
  success: boolean;
  error?: string;
  blocked?: boolean;
  reason?: string;
}

/**
 * Executes the complete refund hierarchy for an eSIM order:
 * 1. Checks if any profile is installed/active -> blocks refund unless explicit admin override note provided.
 * 2. If any profile is 'ready' -> calls cancelEsim(iccid) with the carrier first.
 * 3. Only after carrier cancellation (or provider rejection or override) -> creates full Stripe refund.
 * 4. Records every step into esim_orders.refund_notes audit trail.
 */
export async function refundEsimOrder(
  options: RefundEsimOrderOptions
): Promise<RefundEsimOrderResult> {
  const supabase = createAdminClient();

  const { data: order, error: fetchErr } = await supabase
    .from("esim_orders")
    .select(
      "id, partner_ref, stripe_payment_intent, stripe_session_id, payment_status, fulfilment_status, esims, refund_notes, customer_email, customer_name, plan_id, quantity"
    )
    .eq("id", options.orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    return { success: false, error: "Order not found." };
  }

  if (order.payment_status === "refunded") {
    return { success: false, error: "Order has already been refunded." };
  }

  const esims = (Array.isArray(order.esims) ? (order.esims as Esim[]) : []) as Array<
    Esim & { status?: string }
  >;
  const auditLogs: string[] = [];
  const timestamp = new Date().toISOString();
  auditLogs.push(`[${timestamp}] Refund initiated by ${options.adminEmail || "system"}.`);

  // (iii) Check if any eSIM is installed or active (not cancellable with carrier)
  const nonCancellableUnit = esims.find(
    (u) => u.status === "installed" || u.status === "active"
  );

  if (nonCancellableUnit && !options.overrideNote?.trim()) {
    const reason = `Refund blocked: eSIM profile ${nonCancellableUnit.iccid || "unit"} is marked as '${nonCancellableUnit.status}' (already installed/active on client device) and cannot be cancelled with the carrier. An explicit admin override note is required to proceed.`;
    console.warn(`[esim-fulfilment] ${reason} on order ${order.partner_ref}`);

    auditLogs.push(`[${new Date().toISOString()}] BLOCKED: ${reason}`);
    await supabase
      .from("esim_orders")
      .update({
        refund_notes: [order.refund_notes, ...auditLogs].filter(Boolean).join("\n"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return {
      success: false,
      blocked: true,
      reason,
    };
  }

  if (nonCancellableUnit && options.overrideNote?.trim()) {
    auditLogs.push(
      `[${new Date().toISOString()}] Admin override provided for installed/active unit (${nonCancellableUnit.iccid}): "${options.overrideNote.trim()}".`
    );
  }

  // (i) Cancel each ready unit with carrier first
  const updatedEsims = [...esims];
  for (let i = 0; i < updatedEsims.length; i++) {
    const unit = updatedEsims[i];
    if (unit.status === "ready" && unit.iccid) {
      try {
        console.log(`[esim-fulfilment] Cancelling profile ${unit.iccid} with MegaEsim...`);
        const cancelRes = await cancelEsim(unit.iccid);
        if (cancelRes.cancelled || cancelRes.already) {
          updatedEsims[i] = { ...unit, status: "cancelled" };
          auditLogs.push(
            `[${new Date().toISOString()}] Profile ${unit.iccid} successfully cancelled with carrier (balance returned to wallet).`
          );
        } else {
          throw new Error("Carrier cancellation returned cancelled: false");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[esim-fulfilment] Failed to cancel profile ${unit.iccid}:`, msg);

        if (!options.overrideNote?.trim()) {
          auditLogs.push(
            `[${new Date().toISOString()}] FAILED to cancel profile ${unit.iccid}: ${msg}. Refund halted.`
          );
          await supabase
            .from("esim_orders")
            .update({
              refund_notes: [order.refund_notes, ...auditLogs].filter(Boolean).join("\n"),
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          return {
            success: false,
            error: `Failed to cancel eSIM unit ${unit.iccid} with carrier: ${msg}. Provide an admin override note if you wish to force the Stripe refund.`,
          };
        } else {
          auditLogs.push(
            `[${new Date().toISOString()}] Carrier cancel failed for ${unit.iccid} (${msg}) but proceeding due to admin override.`
          );
        }
      }
    }
  }

  // (ii) Issue full Stripe refund
  try {
    const stripe = getStripe();
    let paymentIntentId = order.stripe_payment_intent;

    if (!paymentIntentId && order.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (typeof session.payment_intent === "string") {
        paymentIntentId = session.payment_intent;
      }
    }

    if (!paymentIntentId) {
      throw new Error(`No payment_intent found to refund for order ${order.id}`);
    }

    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        order_id: order.id,
        partner_ref: order.partner_ref,
        admin_email: options.adminEmail || "system",
        override_note: options.overrideNote || "",
      },
    });

    auditLogs.push(
      `[${new Date().toISOString()}] Full Stripe refund completed successfully for payment intent ${paymentIntentId}.`
    );

    await supabase
      .from("esim_orders")
      .update({
        payment_status: "refunded",
        esims: updatedEsims as unknown as Record<string, unknown>,
        refund_notes: [order.refund_notes, ...auditLogs].filter(Boolean).join("\n"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    console.log(`[esim-fulfilment] Successfully processed full refund for order ${order.partner_ref}`);

    // Send customer refund notice
    if (order.customer_email) {
      await sendCustomerRefundEmail({
        id: order.id,
        partner_ref: order.partner_ref,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        plan_id: order.plan_id,
        quantity: order.quantity,
        customer_phone: null,
        stripe_payment_intent: order.stripe_payment_intent,
        stripe_session_id: order.stripe_session_id,
        expected_amount_minor: null,
        public_token: "",
      });
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe refund failed";
    console.error(`[esim-fulfilment] Stripe refund error on order ${order.id}:`, msg);
    auditLogs.push(`[${new Date().toISOString()}] Stripe refund error: ${msg}`);

    await supabase
      .from("esim_orders")
      .update({
        refund_notes: [order.refund_notes, ...auditLogs].filter(Boolean).join("\n"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return { success: false, error: msg };
  }
}

/**
 * Issues an automatic full refund via Stripe for failed orders (delegates to refundEsimOrder).
 */
export async function refundStripeOrder(order: {
  id: string;
  partner_ref: string;
  stripe_payment_intent: string | null;
  stripe_session_id: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const result = await refundEsimOrder({
    orderId: order.id,
    adminEmail: "system_auto_refund",
    overrideNote: "Automatic provider failure refund",
  });
  return { success: result.success, error: result.error || result.reason };
}

/**
 * Sends branded customer delivery email with QR code, LPA string, and one-tap install links.
 */
export async function sendCustomerDeliveryEmail(
  order: ClaimedOrder,
  esims: Esim[]
): Promise<void> {
  if (!order.customer_email) return;

  const siteOrigin = getSiteOrigin();
  const orderUrl = `${siteOrigin}/esim/order/${order.public_token}`;
  const whatsAppHelpUrl = buildWhatsAppLink(
    `Assalamu Alaikum, I need assistance with my delivered eSIM order ${order.partner_ref}.`
  );

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

          <!-- One-Tap Setup Buttons -->
          <div style="text-align: center; margin: 20px 0;">
            <a href="${appleInstallUrl}" style="display: inline-block; background: #0A0A08; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: bold; margin: 4px 6px;">
              Direct Install on iPhone
            </a>
            <a href="${androidInstallUrl}" style="display: inline-block; background: #C9A227; color: #0A0A08; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: bold; margin: 4px 6px;">
              Direct Install on Android
            </a>
          </div>

          <!-- Manual LPA Fallback -->
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

  const currency = (order.charge_currency || "aed").toUpperCase();
  const amountMinor = order.charged_amount_minor || order.expected_amount_minor || 0;
  const formattedCharged = (amountMinor / 100).toFixed(2);

  const hasPresentment = Boolean(
    order.presentment_currency &&
    order.presentment_amount_minor &&
    order.presentment_currency.toLowerCase() !== (order.charge_currency || "aed").toLowerCase()
  );

  const hasVat = Boolean(order.vat_amount_minor && order.vat_amount_minor > 0);
  const vatAmountMinor = order.vat_amount_minor || 0;
  const vatRatePct = order.vat_rate_pct || 5;
  const netAmountMinor = amountMinor - vatAmountMinor;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Your eSIM is Ready</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 30px 15px; color: #0A0A08;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #eaeaea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <!-- Header -->
          <div style="background: #0A0A08; padding: 28px 30px; text-align: center;">
            <h1 style="color: #C9A227; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">MASAAR HOLIDAYS</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0 0; font-size: 13px;">High-Speed Prepaid Travel eSIM</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px;">
            <h2 style="font-size: 20px; color: #0A0A08; margin-top: 0;">Assalamu Alaikum ${order.customer_name || "Valued Traveller"},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #444444;">
              Your high-speed travel eSIM profiles are provisioned and ready for installation.
            </p>

            <div style="background: #FAF7F2; border-left: 4px solid #C9A227; padding: 16px 20px; margin: 20px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0A0A08;">Order Reference: ${order.partner_ref}</p>
              ${order.invoice_number ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #8F6407; font-weight: bold;">Receipt / Tax Invoice #: ${order.invoice_number}</p>` : ""}
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666666;">Quantity: ${esims.length} eSIM ${esims.length === 1 ? "profile" : "profiles"}</p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #0A0A08;">
                <strong>Amount Charged:</strong> ${
                  hasPresentment
                    ? `${order.presentment_currency!.toUpperCase()} ${(order.presentment_amount_minor! / 100).toFixed(2)} (Settled as ${currency} ${formattedCharged})`
                    : `${currency} ${formattedCharged}`
                }
              </p>
              ${
                hasVat
                  ? `
                  <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #dddddd; font-size: 11px; color: #555555; line-height: 1.5;">
                    <div style="font-weight: bold; color: #8F6407;">Price includes ${vatRatePct}% VAT</div>
                    <div>Subtotal (excl. VAT): ${currency} ${(netAmountMinor / 100).toFixed(2)}</div>
                    <div>VAT (${vatRatePct}%): ${currency} ${(vatAmountMinor / 100).toFixed(2)}</div>
                    ${order.vat_trn ? `<div>Tax Registration Number (TRN): ${order.vat_trn}</div>` : ""}
                  </div>
                `
                  : ""
              }
            </div>

            <!-- Profiles -->
            ${unitsHtml}

            <!-- Installation Instructions -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px;">
              <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #0A0A08;">How to Install:</h4>
              <ol style="font-size: 13px; color: #555555; line-height: 1.6; padding-left: 20px; margin: 0;">
                <li><strong>Connect to Wi-Fi</strong> at home or before your flight.</li>
                <li>Scan the QR code in your phone's <em>Settings &gt; Cellular / Mobile Service &gt; Add eSIM</em>, or tap the Direct Install button.</li>
                <li>Label the eSIM (e.g. <em>Masaar Travel</em>).</li>
                <li>Upon landing at your destination, <strong>turn on Data Roaming</strong> for this eSIM line.</li>
                <li><em>Validity only begins when your phone first connects to a supported local network abroad.</em></li>
              </ol>
            </div>

            <!-- Live Order Page Link -->
            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="${orderUrl}" style="display: inline-block; background: #C9A227; color: #0A0A08; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px;">
                View Order Online
              </a>
            </div>

            <!-- Concierge WhatsApp -->
            <div style="text-align: center; margin-top: 20px;">
              <a href="${whatsAppHelpUrl}" style="color: #25D366; font-size: 13px; text-decoration: underline; font-weight: bold;">
                Need help installing? Chat with our team on WhatsApp
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #fcfcfc; border-top: 1px solid #f0f0f0; padding: 18px 30px; text-align: center; font-size: 11px; color: #888888;">
            <p style="margin: 0;">Masaar Holidays · Sharjah Publishing City, UAE</p>
            <p style="margin: 4px 0 0 0;">Prepaid Data-only eSIM. No analog voice/SMS.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[esim-fulfilment] CRITICAL STARTUP/CONFIG WARNING: SMTP is not configured in production environment. Delivery email for order ${order.partner_ref} to ${order.customer_email} could not be dispatched!`
      );
      const supabase = createAdminClient();
      await supabase
        .from("esim_orders")
        .update({
          needs_attention: true,
          fulfilment_error: "SMTP credentials not configured in production: delivery email not sent.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    } else {
      console.warn(
        `[esim-fulfilment] SMTP not configured in development environment. Skipping email dispatch to ${order.customer_email}.`
      );
    }
    return;
  }

  try {
    await sendDocumentEmail({
      to: order.customer_email,
      subject: `Your eSIM is Ready — Order ${order.partner_ref} | Masaar Holidays`,
      html,
    });
    console.log(`[esim-fulfilment] Customer delivery email sent to ${order.customer_email}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SMTP send failed";
    console.warn(`[esim-fulfilment] Could not dispatch delivery email (check SMTP credentials): ${msg}`);
  }
}

/**
 * Sends refund notice email to customer if order failed permanently.
 */
async function sendCustomerRefundEmail(order: ClaimedOrder): Promise<void> {
  if (!order.customer_email) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; color: #0A0A08;">
      <h2>Assalamu Alaikum ${order.customer_name || "Valued Customer"},</h2>
      <p>We encountered an unexpected network provisioning failure while allocating your eSIM for Order <strong>${order.partner_ref}</strong>.</p>
      <p>A <strong>full refund</strong> has been issued automatically to your original payment card.</p>
      <p>Depending on your bank, the credit will appear on your statement within 3 to 7 business days.</p>
      <p>We sincerely apologize for this inconvenience. If you would like to arrange an alternative travel eSIM, our Dubai concierge is available on WhatsApp.</p>
    </div>
  `;

  try {
    await sendDocumentEmail({
      to: order.customer_email,
      subject: `Order Update & Refund Notice — ${order.partner_ref} | Masaar Holidays`,
      html,
    });
  } catch (err: unknown) {
    console.warn("[esim-fulfilment] Could not send customer refund email:", err);
  }
}

/**
 * Alerts staff of a critical provisioning failure or balance issue.
 */
export async function alertStaffProvisioningIssue({
  order,
  errorMsg,
  code,
}: {
  order: ClaimedOrder;
  errorMsg: string;
  code: string;
}): Promise<void> {
  const staffEmails = getStaffAlertEmails();
  const siteOrigin = getSiteOrigin();
  const adminOrderUrl = `${siteOrigin}/admin/esim-orders`;
  const whatsAppStaffUrl = buildWhatsAppLink(
    `[eSIM Alert] Order ${order.partner_ref} requires attention: ${code} - ${errorMsg}`
  );

  const subject = `[URGENT] eSIM Provisioning Issue — Order ${order.partner_ref}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
      <h2 style="color: #d32f2f;">eSIM Fulfilment Failure Alert</h2>
      <p>An automated eSIM order provisioning attempt failed and requires staff review.</p>
      <ul>
        <li><strong>Order Reference:</strong> ${order.partner_ref}</li>
        <li><strong>Plan ID:</strong> ${order.plan_id}</li>
        <li><strong>Customer:</strong> ${order.customer_name || "N/A"} (${order.customer_email})</li>
        <li><strong>Error Code:</strong> ${code}</li>
        <li><strong>Details:</strong> ${errorMsg}</li>
      </ul>
      <p style="margin-top: 20px;">
        <a href="${adminOrderUrl}" style="background: #0A0A08; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 12px; display: inline-block;">
          Open Admin eSIM Orders
        </a>
        <a href="${whatsAppStaffUrl}" style="background: #25D366; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          WhatsApp Quick Link
        </a>
      </p>
    </div>
  `;

  try {
    await sendDocumentEmail({
      to: staffEmails,
      subject,
      html,
    });
    console.log(`[esim-fulfilment] Staff alert email dispatched to ${staffEmails.join(", ")}`);
  } catch (err: unknown) {
    console.warn(`[esim-fulfilment] Could not send staff alert email:`, err);
  }
}
