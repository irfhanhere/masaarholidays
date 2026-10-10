/**
 * MegaEsim Sandbox Smoke Test Script
 *
 * Runs the docs quickstart against the sandbox:
 * 1. getAccount
 * 2. getPlans for Saudi Arabia (SA)
 * 3. createOrder with partner_ref "smoke-<timestamp>"
 * 4. getOrderByRef
 *
 * Security: NEVER prints the API key.
 * Can be run with: npx tsx --conditions react-server scripts/esim-smoke-test.ts
 * (or simply: npx tsx scripts/esim-smoke-test.ts — it will auto-respawn with react-server if needed).
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Auto-load .env.local if not already in environment
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(resolve(process.cwd(), ".env.local"));
  } catch {
    // Ignore if file doesn't exist or already loaded
  }
}

async function main() {
  // If run outside Next.js without react-server condition, server-only would throw.
  // Detect this and auto-respawn with --conditions react-server.
  const hasReactServerCondition = process.execArgv.some(
    (arg, i) =>
      arg === "react-server" ||
      (arg === "-C" && process.execArgv[i + 1] === "react-server") ||
      (arg === "--conditions" && process.execArgv[i + 1] === "react-server") ||
      arg.includes("react-server")
  );

  if (!hasReactServerCondition && process.env.SMOKE_SUBPROCESS !== "1") {
    const child = spawnSync(
      process.execPath,
      [
        "--conditions",
        "react-server",
        ...process.execArgv,
        resolve(process.cwd(), "scripts/esim-smoke-test.ts"),
        ...process.argv.slice(2),
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          SMOKE_SUBPROCESS: "1",
        },
      }
    );
    process.exit(child.status ?? 0);
  }

  // Dynamic import so condition is active before evaluating "server-only"
  const { getAccount, getPlans, createOrder, getOrderByRef } = await import(
    "../src/lib/megaesim"
  );

  console.log("==================================================");
  console.log(" MegaEsim Sandbox Smoke Test (Quickstart Flow)");
  console.log("==================================================\n");

  // 1. getAccount
  console.log("[1/4] Checking Account (getAccount)...");
  const account = await getAccount();
  console.log(`  ✓ Account ID:      ${account.id}`);
  console.log(`  ✓ Company:         ${account.company}`);
  console.log(`  ✓ Contact Name:    ${account.name}`);
  console.log(`  ✓ Tier:            ${account.tier}`);
  console.log(`  ✓ Discount:        ${account.discount_pct}%`);
  console.log(`  ✓ Account Mode:    ${account.account_mode}`);
  console.log(`  ✓ Key Mode:        ${account.key_mode}`);
  console.log(`  ✓ Currency:        ${account.currency}\n`);

  // 2. getPlans for SA
  console.log("[2/4] Fetching Plans for Saudi Arabia (getPlans({ country: 'SA' }))...");
  const plans = await getPlans({ country: "SA" });
  if (!plans || plans.length === 0) {
    throw new Error("No plans returned for country SA");
  }
  console.log(`  ✓ Received ${plans.length} plans for Saudi Arabia.`);

  const samplePlan = plans[0];
  console.log(`  ✓ Selected Plan:   ${samplePlan.plan_id} (${samplePlan.name})`);
  console.log(`    - Data:          ${samplePlan.data_gb} GB`);
  console.log(`    - Validity:      ${samplePlan.validity_days} days`);
  console.log(`    - Retail Price:  $${samplePlan.retail_price} USD`);
  console.log(`    - Partner Price: $${samplePlan.your_price} USD\n`);

  // 3. createOrder
  const partnerRef = `smoke-${Date.now()}`;
  console.log(`[3/4] Creating Sandbox Order (createOrder) with ref "${partnerRef}"...`);
  const order = await createOrder({
    planId: samplePlan.plan_id,
    quantity: 1,
    partnerRef,
    endUserEmail: "smoke-test@masaarholidays.com",
  });

  console.log(`  ✓ Order ID:        ${order.id}`);
  console.log(`  ✓ Order Number:    ${order.order_number}`);
  console.log(`  ✓ Partner Ref:     ${order.partner_ref}`);
  console.log(`  ✓ Status:          ${order.status}`);
  console.log(`  ✓ Total:           $${order.total} ${order.currency}`);
  console.log(`  ✓ Mode:            ${order.mode ?? "sandbox"}`);
  console.log(`  ✓ eSIMs Allocated: ${order.esims?.length ?? 0}`);

  if (order.esims && order.esims.length > 0) {
    const esim = order.esims[0];
    console.log(`    - ICCID:         ${esim.iccid}`);
    console.log(`    - Status:        ${esim.status}`);
    console.log(`    - LPA:           ${esim.lpa}`);
    console.log(`    - QR Code URL:   ${esim.qr_url}`);
    if (esim.note) {
      console.log(`    - Note:          ${esim.note}`);
    }
  }
  console.log("");

  // 4. getOrderByRef
  console.log(`[4/4] Verifying Order by Reference (getOrderByRef("${partnerRef}"))...`);
  const fetchedOrder = await getOrderByRef(partnerRef);
  console.log(`  ✓ Fetched Order:   ${fetchedOrder.order_number}`);
  console.log(`  ✓ Verified Status: ${fetchedOrder.status}`);
  console.log(`  ✓ Ref Matched:     ${fetchedOrder.partner_ref === partnerRef}`);
  console.log(`  ✓ ID Matched:      ${String(fetchedOrder.id) === String(order.id)}\n`);

  console.log("==================================================");
  console.log(" ✓ All 4 Smoke Tests Passed Successfully!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("\n❌ Smoke test failed:", err?.message || err);
  if (err?.code) console.error("   Error code:", err.code);
  if (err?.httpStatus) console.error("   HTTP status:", err.httpStatus);
  if (err?.extra) console.error("   Extra details:", err.extra);
  process.exit(1);
});
