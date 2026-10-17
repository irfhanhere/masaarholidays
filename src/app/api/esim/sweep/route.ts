import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderByRef, MegaEsimError, type Esim } from "@/lib/megaesim";
import {
  fulfilEsimOrder,
  retryFulfilEsimOrder,
  sendCustomerDeliveryEmail,
  alertStaffProvisioningIssue,
} from "@/lib/esim-fulfilment";
import type { EsimOrderRowShape } from "@/lib/types/database";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Validates request authorization using CRON_SECRET.
 * Supports:
 * - Authorization: Bearer <CRON_SECRET>
 * - x-cron-secret: <CRON_SECRET>
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // If not configured in development, permit local execution; in production, require secret
    if (process.env.NODE_ENV === "production") {
      console.error("[esim-sweep] CRON_SECRET is not configured in production environment!");
      return false;
    }
    return true;
  }

  const authHeader = request.headers.get("authorization")?.trim();
  const xSecretHeader = request.headers.get("x-cron-secret")?.trim();

  if (authHeader && authHeader.toLowerCase() === `bearer ${secret.toLowerCase()}`) {
    return true;
  }

  if (xSecretHeader && xSecretHeader === secret) {
    return true;
  }

  return false;
}

/**
 * Shared sweep execution logic for GET and POST.
 */
async function runSweep() {
  const supabase = createAdminClient();
  const now = Date.now();

  const cutoffA = new Date(now - 3 * 60 * 1000).toISOString(); // 3 minutes ago
  const cutoffB = new Date(now - 15 * 60 * 1000).toISOString(); // 15 minutes ago
  const cutoffC = new Date(now - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago

  const results = {
    groupA_pending_older_than_3m: 0,
    groupB_processing_older_than_15m: 0,
    groupC_abandoned_older_than_24h: 0,
    errors: [] as string[],
  };

  // -------------------------------------------------------------
  // Group A: Paid orders still 'pending' fulfilment older than 3m
  // -------------------------------------------------------------
  try {
    let { data: groupA, error: errA } = await supabase
      .from("esim_orders")
      .select("id, partner_ref, plan_id, quantity, customer_name, customer_email, sweep_count, needs_attention, created_at")
      .eq("payment_status", "paid")
      .eq("fulfilment_status", "pending")
      .lte("created_at", cutoffA);

    if (errA && errA.message.toLowerCase().includes("sweep_count")) {
      const fallback = await supabase
        .from("esim_orders")
        .select("id, partner_ref, plan_id, quantity, customer_name, customer_email, needs_attention, created_at")
        .eq("payment_status", "paid")
        .eq("fulfilment_status", "pending")
        .lte("created_at", cutoffA);
      groupA = fallback.data as any;
      errA = fallback.error;
    }

    if (errA) {
      throw new Error(`Group A query failed: ${errA.message}`);
    }

    if (groupA && groupA.length > 0) {
      for (const order of groupA) {
        results.groupA_pending_older_than_3m++;
        const nextSweepCount = (order.sweep_count || 0) + 1;
        const reachedMaxSweeps = nextSweepCount >= 3;

        console.log(
          `[esim-sweep] Group A: Retrying pending order ${order.partner_ref} (sweep ${nextSweepCount}/3)`
        );

        const updatePayload: Partial<EsimOrderRowShape> = {
          sweep_count: nextSweepCount,
          updated_at: new Date().toISOString(),
        };

        if (reachedMaxSweeps && !order.needs_attention) {
          updatePayload.needs_attention = true;
          updatePayload.fulfilment_error = `Order paid but still pending fulfilment after ${nextSweepCount} sweep cycles (>9m).`;

          await alertStaffProvisioningIssue({
            order: {
              id: order.id,
              partner_ref: order.partner_ref,
              plan_id: order.plan_id,
              quantity: order.quantity,
              customer_name: order.customer_name,
              customer_email: order.customer_email,
              customer_phone: null,
              stripe_payment_intent: null,
              stripe_session_id: null,
              expected_amount_minor: null,
              public_token: "",
            },
            errorMsg: `Paid order has remained pending fulfilment across ${nextSweepCount} automated sweeps. Requires manual carrier review.`,
            code: "SWEEP_STUCK_PENDING",
          });
        }

        const { error: updErr } = await supabase.from("esim_orders").update(updatePayload).eq("id", order.id);
        if (updErr && updErr.message.toLowerCase().includes("sweep_count")) {
          const { sweep_count: _sc, ...withoutSweep } = updatePayload;
          await supabase.from("esim_orders").update(withoutSweep).eq("id", order.id);
        }

        // Re-run fulfilment
        try {
          await fulfilEsimOrder(order.id);
        } catch (fErr: unknown) {
          const msg = fErr instanceof Error ? fErr.message : String(fErr);
          results.errors.push(`Order ${order.partner_ref} fulfilment error: ${msg}`);
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.errors.push(`Group A error: ${msg}`);
  }

  // -------------------------------------------------------------
  // Group B: Orders stuck 'processing' older than 15m
  // -------------------------------------------------------------
  try {
    let { data: groupB, error: errB } = await supabase
      .from("esim_orders")
      .select(
        "id, partner_ref, plan_id, quantity, customer_name, customer_email, customer_phone, public_token, sweep_count, needs_attention, esims, created_at, updated_at"
      )
      .eq("payment_status", "paid")
      .eq("fulfilment_status", "processing")
      .lte("updated_at", cutoffB);

    if (errB && errB.message.toLowerCase().includes("sweep_count")) {
      const fallback = await supabase
        .from("esim_orders")
        .select(
          "id, partner_ref, plan_id, quantity, customer_name, customer_email, customer_phone, public_token, needs_attention, esims, created_at, updated_at"
        )
        .eq("payment_status", "paid")
        .eq("fulfilment_status", "processing")
        .lte("updated_at", cutoffB);
      groupB = fallback.data as any;
      errB = fallback.error;
    }

    if (errB) {
      throw new Error(`Group B query failed: ${errB.message}`);
    }

    if (groupB && groupB.length > 0) {
      for (const order of groupB) {
        results.groupB_processing_older_than_15m++;
        const nextSweepCount = (order.sweep_count || 0) + 1;
        const reachedMaxSweeps = nextSweepCount >= 3;

        console.log(
          `[esim-sweep] Group B: Checking stuck processing order ${order.partner_ref} via getOrderByRef (sweep ${nextSweepCount}/3)`
        );

        let resolvedWithCarrier = false;
        try {
          // Re-fetch with getOrderByRef using the same partner_ref before retrying
          const providerOrder = await getOrderByRef(order.partner_ref);

          if (providerOrder) {
            const esims = Array.isArray(providerOrder.esims) ? providerOrder.esims : [];
            const allAllocated = esims.length >= order.quantity && esims.every((u: Esim) => !!u.iccid);

            if (providerOrder.status === "completed" || allAllocated) {
              // Successfully allocated on carrier side!
              await supabase
                .from("esim_orders")
                .update({
                  fulfilment_status: "completed",
                  megaesim_order_number: providerOrder.order_number,
                  megaesim_order_id: String(providerOrder.id),
                  esims: esims as unknown as Record<string, unknown>,
                  fulfilment_error: null,
                  needs_attention: false,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", order.id);

              await sendCustomerDeliveryEmail(
                {
                  id: order.id,
                  partner_ref: order.partner_ref,
                  plan_id: order.plan_id,
                  quantity: order.quantity,
                  customer_name: order.customer_name,
                  customer_email: order.customer_email,
                  customer_phone: order.customer_phone,
                  stripe_payment_intent: null,
                  stripe_session_id: null,
                  expected_amount_minor: null,
                  public_token: order.public_token,
                },
                esims
              );

              resolvedWithCarrier = true;
              console.log(
                `[esim-sweep] Order ${order.partner_ref} resolved as completed via carrier ref check!`
              );
            } else if (
              providerOrder.status === "provisioning_failed" ||
              providerOrder.status === "refunded" ||
              providerOrder.status === "cancelled"
            ) {
              await supabase
                .from("esim_orders")
                .update({
                  fulfilment_status: "failed",
                  fulfilment_error: `Carrier marked order as ${providerOrder.status}.`,
                  needs_attention: true,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", order.id);

              await alertStaffProvisioningIssue({
                order: {
                  id: order.id,
                  partner_ref: order.partner_ref,
                  plan_id: order.plan_id,
                  quantity: order.quantity,
                  customer_name: order.customer_name,
                  customer_email: order.customer_email,
                  customer_phone: null,
                  stripe_payment_intent: null,
                  stripe_session_id: null,
                  expected_amount_minor: null,
                  public_token: "",
                },
                errorMsg: `Carrier status is '${providerOrder.status}'. Order failed.`,
                code: "CARRIER_ORDER_FAILED",
              });

              resolvedWithCarrier = true;
            }
          }
        } catch (provErr: unknown) {
          const is404 =
            provErr instanceof MegaEsimError && (provErr.httpStatus === 404 || provErr.code === "not_found");
          if (!is404) {
            console.warn(
              `[esim-sweep] getOrderByRef error on ${order.partner_ref}:`,
              provErr instanceof Error ? provErr.message : provErr
            );
          }
        }

        if (!resolvedWithCarrier) {
          const updatePayload: Partial<EsimOrderRowShape> = {
            sweep_count: nextSweepCount,
            updated_at: new Date().toISOString(),
          };

          if (reachedMaxSweeps && !order.needs_attention) {
            updatePayload.needs_attention = true;
            updatePayload.fulfilment_error = `Order stuck processing for >15m after ${nextSweepCount} sweeps.`;

            await alertStaffProvisioningIssue({
              order: {
                id: order.id,
                partner_ref: order.partner_ref,
                plan_id: order.plan_id,
                quantity: order.quantity,
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                customer_phone: null,
                stripe_payment_intent: null,
                stripe_session_id: null,
                expected_amount_minor: null,
                public_token: "",
              },
              errorMsg: `Order has remained stuck in 'processing' status across ${nextSweepCount} automated sweeps (>45 minutes). Requires staff investigation.`,
              code: "SWEEP_STUCK_PROCESSING",
            });
          }

          const { error: updBErr } = await supabase.from("esim_orders").update(updatePayload).eq("id", order.id);
          if (updBErr && updBErr.message.toLowerCase().includes("sweep_count")) {
            const { sweep_count: _sc, ...withoutSweep } = updatePayload;
            await supabase.from("esim_orders").update(withoutSweep).eq("id", order.id);
          }

          // Retry fulfilment
          await retryFulfilEsimOrder(order.id);
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.errors.push(`Group B error: ${msg}`);
  }

  // -------------------------------------------------------------
  // Group C: payment_status 'pending' older than 24 hours
  // -------------------------------------------------------------
  try {
    const { data: groupC, error: errC } = await supabase
      .from("esim_orders")
      .select("id, partner_ref, created_at")
      .eq("payment_status", "pending")
      .lte("created_at", cutoffC);

    if (errC) {
      throw new Error(`Group C query failed: ${errC.message}`);
    }

    if (groupC && groupC.length > 0) {
      for (const order of groupC) {
        results.groupC_abandoned_older_than_24h++;
        console.log(`[esim-sweep] Group C: Marking abandoned order ${order.partner_ref}`);

        // Try marking as abandoned; fallback to failed if migration not applied yet
        const { error: updErr } = await supabase
          .from("esim_orders")
          .update({
            payment_status: "abandoned",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updErr) {
          // If check constraint rejects 'abandoned', fallback to 'failed'
          await supabase
            .from("esim_orders")
            .update({
              payment_status: "failed",
              fulfilment_error: "Payment session abandoned after 24 hours.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.errors.push(`Group C error: ${msg}`);
  }

  return results;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runSweep();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    ...results,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runSweep();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    ...results,
  });
}
