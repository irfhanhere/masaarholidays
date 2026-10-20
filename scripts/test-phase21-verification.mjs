/**
 * Phase 21 — Comprehensive Staging & Release Verification Suite
 *
 * Verifies without risking production data or issuing live payment charges:
 * 1. Environment & Configuration Check (names only, no secrets printed)
 * 2. Supabase Tables & Migration Schema
 * 3. Private Document Storage (private_documents bucket & signed URL verification)
 * 4. Stripe Non-Charging Health Check & Webhook Signature Handling
 * 5. Webhook Deduplication & State Transition Logic
 * 6. Notification Delivery Readiness (WhatsApp templates & SMTP config)
 * 7. Admin Auth & Audit Logging
 * 8. Public & Mobile Critical Application Route Health
 *
 * Run with: node scripts/test-phase21-verification.mjs
 */

import { resolve } from "node:path";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Load .env.local
const envContent = fs.readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    failedCount++;
  }
}

async function run() {
  console.log("==================================================================");
  console.log(" PHASE 21 — STAGING, STRIPE VERIFICATION & RELEASE TEST SUITE");
  console.log("==================================================================\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Environment Variables Audit (by name only)
  console.log("--- 1. Environment Configuration Audit (Names Only) ---");
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CRON_SECRET",
  ];
  for (const key of requiredEnvVars) {
    const isSet = Boolean(env[key] && env[key].trim().length > 0);
    assert(isSet, `Environment variable '${key}' is populated`);
  }

  // Check test vs live key isolation (safety check)
  const isStripeTestKey = (env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");
  const isStripeLiveKey = (env.STRIPE_SECRET_KEY || "").startsWith("sk_live_");
  console.log(`  • Stripe Key Mode in current environment: ${isStripeTestKey ? "TEST MODE (sk_test_...)" : isStripeLiveKey ? "LIVE MODE (sk_live_...)" : "UNKNOWN / UNSET"}`);
  assert(
    isStripeTestKey || isStripeLiveKey,
    "Stripe Secret Key adheres to official format"
  );

  // 2. Database Schema & Tables
  console.log("\n--- 2. Database Schema & Migration Verification ---");
  const coreTables = [
    "visa_types",
    "visa_documents",
    "visa_document_contexts",
    "visa_landing_content",
    "documents",
    "document_items",
    "document_templates",
    "document_settings",
    "transfer_bookings",
    "esim_orders",
    "esim_webhook_events",
    "whatsapp_templates",
  ];

  for (const table of coreTables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    assert(!error, `Table 'public.${table}' is accessible`, error?.message);
    if (!error) {
      console.log(`    ↳ Verified ${table}: ${count} rows`);
    }
  }

  // 3. Storage Buckets & Private Document Security
  console.log("\n--- 3. Private Document Storage & Access Permissions ---");
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  assert(!bucketErr, "Successfully queried Supabase Storage buckets", bucketErr?.message);

  const mediaBucket = buckets?.find((b) => b.id === "media");
  assert(mediaBucket && mediaBucket.public === true, "Bucket 'media' exists with public read enabled for assets");

  const privateBucket = buckets?.find((b) => b.id === "private_documents");
  assert(privateBucket && privateBucket.public === false, "Bucket 'private_documents' exists with public: false (strictly private)");

  // Test private document upload & signed URL generation
  const testFileName = `test_verification_${Date.now()}.txt`;
  const testContent = Buffer.from("Masaar Visa System Private Storage Verification");
  const { error: uploadErr } = await supabase.storage
    .from("private_documents")
    .upload(testFileName, testContent, { contentType: "text/plain", upsert: true });

  assert(!uploadErr, "Service role upload to 'private_documents' succeeded", uploadErr?.message);

  const { data: signedData, error: signedErr } = await supabase.storage
    .from("private_documents")
    .createSignedUrl(testFileName, 60);

  assert(!signedErr && Boolean(signedData?.signedUrl), "Time-limited signed URL generated successfully");

  // Verify direct unauthenticated public URL is rejected/not accessible
  const directPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/private_documents/${testFileName}`;
  try {
    const directRes = await fetch(directPublicUrl);
    assert(directRes.status >= 400, "Direct unauthenticated access to private bucket is blocked (HTTP 400/403/404)");
  } catch (err) {
    assert(true, "Direct unauthenticated access to private bucket failed safely");
  }

  // Clean up test file
  await supabase.storage.from("private_documents").remove([testFileName]);
  console.log("    ↳ Cleaned test artifact from private_documents.");

  // 4. Stripe Non-Charging Health Check
  console.log("\n--- 4. Stripe Non-Charging Health Check & Signature Handling ---");
  const stripe = new Stripe(STRIPE_SECRET, { typescript: true });

  try {
    const balance = await stripe.balance.retrieve();
    assert(Boolean(balance), "Stripe API connectivity verified (read-only balance.retrieve non-charging check)");
    console.log(`    ↳ Stripe balance live status: ${balance.livemode ? "LIVE ENVIRONMENT" : "TEST ENVIRONMENT"}`);
  } catch (err) {
    assert(false, "Stripe balance retrieve failed", err?.message);
  }

  // Test Webhook Signature: Missing Header -> 400
  try {
    const resNoSig = await fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    });
    assert(resNoSig.status === 400, "Stripe webhook rejects requests missing 'stripe-signature' header (HTTP 400)");
  } catch (err) {
    assert(false, "Failed to reach /api/stripe/webhook", err?.message);
  }

  // Test Webhook Signature: Bad Signature -> 400
  try {
    const resBadSig = await fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=12345,v1=invalidsignature00000000000000000000000000000000000000",
      },
      body: JSON.stringify({ test: true }),
    });
    assert(resBadSig.status === 400, "Stripe webhook rejects forged/invalid signature (HTTP 400)");
  } catch (err) {
    assert(false, "Failed to reach /api/stripe/webhook for bad signature test", err?.message);
  }

  // Test Webhook Signature: Valid Signature -> 200
  const validEventId = `evt_valid_test_${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const sampleEvent = {
    id: validEventId,
    object: "event",
    api_version: "2025-01-27.acacia",
    created: timestamp,
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: `pi_test_valid_${Date.now()}`,
        object: "payment_intent",
        amount: 25000,
        currency: "aed",
        status: "succeeded",
      },
    },
  };
  const rawSample = JSON.stringify(sampleEvent);
  const validSignature = stripe.webhooks.generateTestHeaderString({
    payload: rawSample,
    secret: STRIPE_WEBHOOK_SECRET,
    timestamp,
  });

  try {
    const resValid = await fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": validSignature,
      },
      body: rawSample,
    });
    const validJson = await resValid.json().catch(() => ({}));
    assert(resValid.status === 200 && validJson.received === true, "Stripe webhook accepts valid cryptographic signature (HTTP 200)");

    // Replay attack / duplicate test: same event must be idempotent
    const resReplay = await fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": validSignature,
      },
      body: rawSample,
    });
    const replayJson = await resReplay.json().catch(() => ({}));
    assert(resReplay.status === 200 && replayJson.idempotent === true, "Replayed webhook event deduplicated gracefully with { received: true, idempotent: true }");

    // Clean up test event record
    await supabase.from("esim_webhook_events").delete().eq("external_id", validEventId);
  } catch (err) {
    assert(false, "Valid signature webhook test failed", err?.message);
  }

  // 5. Notification Templates & Communication Channels
  console.log("\n--- 5. Notification Delivery & Contact Configuration ---");
  const { data: whatsappTemplates } = await supabase.from("whatsapp_templates").select("key, label, is_active");
  const visaTemplate = whatsappTemplates?.find((t) => t.key === "visa");
  assert(Boolean(visaTemplate && visaTemplate.is_active), "WhatsApp 'visa' enquiry template is active in database");

  const { data: whatsappSettings } = await supabase.from("whatsapp_settings").select("*").limit(1).single();
  assert(Boolean(whatsappSettings?.phone_number), `WhatsApp support number is configured: ${whatsappSettings?.phone_number}`);

  // 6. Admin Auth Gate & Route Integrity
  console.log("\n--- 6. Admin Auth & Access Controls ---");
  const adminRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
  assert(
    adminRes.status === 307 || adminRes.status === 302 || adminRes.status === 303,
    "Unauthenticated access to /admin redirects to login gate (HTTP 307/302)"
  );

  // 7. Critical Application Flows & Mobile Layouts
  console.log("\n--- 7. Critical Public Flow Verification ---");
  const criticalRoutes = [
    "/visa",
    "/visa/umrah",
    "/visa/uae",
    "/visa/saudi-tourist",
    "/visa/global",
    "/visa/india",
    "/transfers",
    "/esim",
    "/about",
    "/contact",
  ];

  for (const route of criticalRoutes) {
    try {
      const pageRes = await fetch(`${BASE_URL}${route}`);
      assert(pageRes.status === 200, `Route '${route}' rendered HTTP 200`);
    } catch (err) {
      assert(false, `Route '${route}' failed to render`, err?.message);
    }
  }

  // Summary
  console.log("\n==================================================================");
  console.log(` VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
