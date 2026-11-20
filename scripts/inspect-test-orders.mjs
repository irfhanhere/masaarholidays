import fs from "node:fs";
import path from "node:path";

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

async function inspectOrders() {
  const refs = ["MH-YJZJHRE5ID", "MH-OY6X95BOKV"];
  for (const ref of refs) {
    console.log("\n=============================================");
    console.log(`Querying Supabase for partner_ref: ${ref}`);
    const { data, error } = await supabase
      .from("esim_orders")
      .select("*")
      .eq("partner_ref", ref)
      .single();

    if (error || !data) {
      console.log("Error or not found in Supabase:", error);
      continue;
    }

    console.log(`Order DB ID: ${data.id}`);
    console.log(`Created At: ${data.created_at}`);
    console.log(`Amount USD: ${data.amount_usd}`);
    console.log(`Payment Provider: ${data.payment_provider}`);
    console.log(`Payment Ref: ${data.payment_ref}`);
    console.log(`Stripe/Payment Intent: ${data.stripe_payment_intent}`);
    console.log(`Payment Status: ${data.payment_status}`);
    console.log(`Fulfilment Status: ${data.fulfilment_status}`);
    console.log(`Refund Notes: ${data.refund_notes}`);
    console.log(`Customer Email: ${data.customer_email}`);
    console.log(`Customer Phone: ${data.customer_phone}`);
    console.log(`Plan ID: ${data.plan_id}`);
    console.log("eSIMs JSON:", JSON.stringify(data.esims, null, 2));

    const paymentId = data.payment_ref || data.stripe_payment_intent;
    if (paymentId) {
      console.log(`\nQuerying Tabby Sandbox API for Payment ID: ${paymentId}`);
      try {
        const tabbyRes = await fetch(`https://api.tabby.ai/api/v2/payments/${encodeURIComponent(paymentId)}`, {
          headers: {
            Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
            Accept: "application/json",
          },
        });
        console.log(`Tabby API HTTP Status: ${tabbyRes.status}`);
        const tabbyData = await tabbyRes.json();
        console.log(`Tabby Authoritative Status: ${tabbyData.status}`);
        console.log(`Amount: ${tabbyData.amount} ${tabbyData.currency}`);
        console.log(`Created At: ${tabbyData.created_at}`);
        console.log(`Closed At: ${tabbyData.closed_at}`);
        console.log("Captures:", JSON.stringify(tabbyData.captures || [], null, 2));
        console.log("Refunds:", JSON.stringify(tabbyData.refunds || [], null, 2));
        console.log("Buyer:", JSON.stringify(tabbyData.buyer || {}, null, 2));
      } catch (err) {
        console.error("Tabby API fetch error:", err.message);
      }
    }
  }
}

inspectOrders().catch(console.error);
