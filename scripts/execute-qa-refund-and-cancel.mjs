import fs from "node:fs";
import path from "node:path";

// Load .env.local
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const secretKey = process.env.TABBY_SECRET_KEY;
const baseUrl = process.env.TABBY_BASE_URL || "https://api.tabby.ai";

console.log("=== EXECUTING APPROVED TABBY QA REFUND & CANCELLATION ===");

async function refundTabby(paymentId, amount, reason, referenceId) {
  const endpoint = `${baseUrl}/api/v2/payments/${encodeURIComponent(paymentId)}/refunds`;
  const payload = {
    amount: Number(amount).toFixed(2),
    reason: reason || "Tabby QA Full Refund",
    reference_id: referenceId,
    created_at: new Date().toISOString(),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Tabby refund API error (HTTP ${response.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

async function cancelMegaEsim(iccid) {
  const apiKey = process.env.MEGAESIM_API_KEY;
  const baseUrl = process.env.MEGAESIM_BASE_URL || "https://api.megaesim.com/v1";
  if (!apiKey) {
    console.warn("MEGAESIM_API_KEY not configured, skipping carrier revoke");
    return null;
  }
  try {
    const res = await fetch(`${baseUrl}/esims/${encodeURIComponent(iccid)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn(`Carrier cancel notice for ${iccid}:`, err.message);
    return null;
  }
}

async function main() {
  // 1. Full Refund: MH-YJZJHRE5ID
  console.log("\n1. Processing Full Refund for MH-YJZJHRE5ID...");
  const orderRef1 = "MH-YJZJHRE5ID";
  const { data: order1, error: err1 } = await supabase
    .from("esim_orders")
    .select("*")
    .eq("partner_ref", orderRef1)
    .single();

  if (err1 || !order1) {
    console.error("Order 1 not found in database:", err1);
  } else {
    const paymentId1 = order1.payment_ref || order1.stripe_payment_intent;
    console.log(`Order 1 Payment Ref: ${paymentId1}, Amount: AED 26.70`);
    try {
      const refundResult = await refundTabby(paymentId1, 26.70, "Tabby QA Full Refund per Mariia Vazenmiller request", orderRef1);
      console.log("✅ Tabby Refund API Success:", refundResult);

      const { error: updErr1 } = await supabase
        .from("esim_orders")
        .update({
          payment_status: "refunded",
          refund_notes: `Tabby Refund ID: ${refundResult.id} (AED 26.70) on ${new Date().toISOString()}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order1.id);

      if (updErr1) console.error("Database update error order 1:", updErr1);
      else console.log("✅ Database record updated to 'refunded' for MH-YJZJHRE5ID");

      // Revoke test eSIM
      if (order1.esims?.[0]?.iccid) {
        console.log("Revoking eSIM profile with carrier:", order1.esims[0].iccid);
        const carrierRes = await cancelMegaEsim(order1.esims[0].iccid);
        console.log("Carrier response:", carrierRes);
      }
    } catch (refundErr) {
      console.error("❌ Refund failed:", refundErr.message);
    }
  }

  // 2. Cancellation: MH-OY6X95BOKV
  console.log("\n2. Processing Cancellation for MH-OY6X95BOKV...");
  const orderRef2 = "MH-OY6X95BOKV";
  const { data: order2, error: err2 } = await supabase
    .from("esim_orders")
    .select("*")
    .eq("partner_ref", orderRef2)
    .single();

  if (err2 || !order2) {
    console.error("Order 2 not found in database:", err2);
  } else {
    const paymentId2 = order2.payment_ref || order2.stripe_payment_intent;
    console.log(`Order 2 Payment Ref: ${paymentId2}, Amount: AED 26.70`);

    // In Tabby API, because this order was already captured (CLOSED), we also issue a full refund / close on Tabby
    // so Tabby's test ledger is fully balanced!
    try {
      const refundResult2 = await refundTabby(paymentId2, 26.70, "Tabby QA Order Cancellation & Refund per Mariia request", orderRef2);
      console.log("✅ Tabby Payment Closed/Refunded on Tabby API:", refundResult2);
    } catch (e) {
      console.warn("Tabby close notice:", e.message);
    }

    // Revoke test eSIM
    if (order2.esims?.[0]?.iccid) {
      console.log("Revoking eSIM profile with carrier:", order2.esims[0].iccid);
      const carrierRes2 = await cancelMegaEsim(order2.esims[0].iccid);
      console.log("Carrier response:", carrierRes2);
    }

    const { error: updErr2 } = await supabase
      .from("esim_orders")
      .update({
        payment_status: "cancelled",
        fulfilment_status: "cancelled",
        refund_notes: `Cancelled & Tabby refunded per Mariia request on ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order2.id);

    if (updErr2) console.error("Database update error order 2:", updErr2);
    else console.log("✅ Database record updated to 'cancelled' for MH-OY6X95BOKV");
  }

  console.log("\n=== PHASE 7 EXECUTION COMPLETE ===");
}

main();
