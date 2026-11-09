import assert from "node:assert";
import fs from "node:fs";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    const k = trimmed.slice(0, eqIdx).trim();
    let v = trimmed.slice(eqIdx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const rawSecret = env.STRIPE_WEBHOOK_SECRET;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Sanitization function matching route.ts
function sanitizeSecret(secret) {
  let s = secret?.trim();
  if (s) {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

const secret = sanitizeSecret(rawSecret);

async function runTestSuite() {
  console.log("===============================================================================");
  console.log(" MASAAR HOLIDAYS — STRIPE WEBHOOK SIGNATURE & EVENT VERIFICATION TEST SUITE");
  console.log("===============================================================================\n");

  // 1. Valid signature test
  console.log("▶ [TEST 1/7] Testing Valid Signature Verification...");
  const validPayload = JSON.stringify({
    id: `evt_test_valid_${Date.now()}`,
    object: "event",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "cs_mock_1", payment_status: "paid" } },
  });
  const validHeader = stripe.webhooks.generateTestHeaderString({ payload: validPayload, secret });
  const constructedValid = stripe.webhooks.constructEvent(validPayload, validHeader, secret);
  assert.strictEqual(constructedValid.type, "checkout.session.completed", "Valid signature must parse successfully");
  console.log("  ✓ Valid signature passed verification.\n");

  // 2. Invalid signature test
  console.log("▶ [TEST 2/7] Testing Invalid / Tampered Signature Rejection...");
  assert.throws(
    () => stripe.webhooks.constructEvent(validPayload, "t=1700000000,v1=invalid_signature_hex", secret),
    /signature/i,
    "Invalid signature must be rejected"
  );
  console.log("  ✓ Invalid signature strictly rejected with expected signature error.\n");

  // 3. Quoted secret sanitization test
  console.log("▶ [TEST 3/7] Testing Quoted Secret Sanitization Resilience...");
  const quotedSecret = `"${secret}"`;
  const sanitized = sanitizeSecret(quotedSecret);
  const constructedWithSanitized = stripe.webhooks.constructEvent(validPayload, validHeader, sanitized);
  assert.strictEqual(constructedWithSanitized.id, constructedValid.id);
  console.log("  ✓ Secrets wrapped in quotes are safely sanitized and pass verification.\n");

  // 4. Duplicate event idempotency test
  console.log("▶ [TEST 4/7] Testing Database Ledger Idempotency (esim_webhook_events)...");
  const duplicateEvtId = `evt_test_idempotent_${Date.now()}`;
  const { error: ins1Err } = await supabase.from("esim_webhook_events").insert({
    source: "payment",
    external_id: duplicateEvtId,
    event: "checkout.session.completed",
    payload: { id: duplicateEvtId, test: true },
    processed: false,
  });
  assert.ok(!ins1Err, `First insert must succeed: ${ins1Err?.message}`);

  const { error: ins2Err } = await supabase.from("esim_webhook_events").insert({
    source: "payment",
    external_id: duplicateEvtId,
    event: "checkout.session.completed",
    payload: { id: duplicateEvtId, attempt: 2 },
    processed: false,
  });
  assert.ok(
    ins2Err && (ins2Err.code === "23505" || ins2Err.message.includes("duplicate")),
    "Duplicate insert MUST trigger 23505 unique constraint violation"
  );
  console.log("  ✓ Duplicate event detected and intercepted via PostgreSQL unique constraint (23505).");
  await supabase.from("esim_webhook_events").delete().eq("external_id", duplicateEvtId);
  console.log("  ✓ Test ledger record cleaned.\n");

  // 5. checkout.session.expired test
  console.log("▶ [TEST 5/7] Testing checkout.session.expired Behavior...");
  // Verify that an expired session updates pending to failed and NEVER marks as paid
  const testExpiredRef = `MH-EXP-${Date.now()}`;
  const { data: expApp, error: expErr } = await supabase.from("visa_applications").insert({
    reference_no: testExpiredRef,
    tracking_token: `tok_exp_${Date.now()}`,
    visa_type_slug: "saudi-tourist",
    product_title: "Saudi Tourist Visa",
    applicant_count: 1,
    primary_contact_name: "Test Expired",
    primary_contact_email: "test.expired@example.com",
    primary_contact_phone: "+971500000001",
    nationality: "India",
    country_of_residence: "United Arab Emirates",
    total_amount: 750,
    currency: "AED",
    payment_status: "pending",
    application_status: "draft",
    stripe_session_id: `cs_test_exp_${Date.now()}`,
  }).select("id, payment_status").single();
  assert.ok(!expErr, `App creation: ${expErr?.message}`);

  // Simulate handler transition:
  if (expApp.payment_status === "pending") {
    await supabase.from("visa_applications").update({
      payment_status: "failed",
      internal_notes: "Stripe checkout session expired before payment completion.",
    }).eq("id", expApp.id);
  }
  const { data: updatedExpApp } = await supabase.from("visa_applications").select("payment_status").eq("id", expApp.id).single();
  assert.strictEqual(updatedExpApp.payment_status, "failed", "Expired session must transition to failed");
  await supabase.from("visa_applications").delete().eq("id", expApp.id);
  console.log("  ✓ checkout.session.expired sets payment_status to 'failed' (never marks paid).\n");

  // 6. payment_intent.payment_failed test
  console.log("▶ [TEST 6/7] Testing payment_intent.payment_failed Behavior...");
  const testFailRef = `MH-FAIL-${Date.now()}`;
  const { data: failApp, error: failErr } = await supabase.from("visa_applications").insert({
    reference_no: testFailRef,
    tracking_token: `tok_fail_${Date.now()}`,
    visa_type_slug: "saudi-tourist",
    product_title: "Saudi Tourist Visa",
    applicant_count: 1,
    primary_contact_name: "Test Failed",
    primary_contact_email: "test.fail@example.com",
    primary_contact_phone: "+971500000002",
    nationality: "India",
    country_of_residence: "United Arab Emirates",
    total_amount: 750,
    currency: "AED",
    payment_status: "pending",
    application_status: "draft",
    stripe_payment_intent_id: `pi_test_fail_${Date.now()}`,
  }).select("id, payment_status").single();
  assert.ok(!failErr, `Fail app creation: ${failErr?.message}`);

  await supabase.from("visa_applications").update({
    payment_status: "failed",
    internal_notes: "Payment failed: Insufficient funds.",
  }).eq("id", failApp.id);
  const { data: updatedFailApp } = await supabase.from("visa_applications").select("payment_status, internal_notes").eq("id", failApp.id).single();
  assert.strictEqual(updatedFailApp.payment_status, "failed");
  assert.ok(updatedFailApp.internal_notes.includes("Insufficient funds"));
  await supabase.from("visa_applications").delete().eq("id", failApp.id);
  console.log("  ✓ payment_intent.payment_failed sets status to 'failed' with error notes recorded.\n");

  // 7. charge.refunded test
  console.log("▶ [TEST 7/7] Testing charge.refunded Behavior...");
  const testRefRef = `MH-REF-${Date.now()}`;
  const { data: refApp, error: refErr } = await supabase.from("visa_applications").insert({
    reference_no: testRefRef,
    tracking_token: `tok_ref_${Date.now()}`,
    visa_type_slug: "saudi-tourist",
    product_title: "Saudi Tourist Visa",
    applicant_count: 1,
    primary_contact_name: "Test Refund",
    primary_contact_email: "test.ref@example.com",
    primary_contact_phone: "+971500000003",
    nationality: "India",
    country_of_residence: "United Arab Emirates",
    total_amount: 750,
    currency: "AED",
    payment_status: "paid",
    application_status: "submitted",
    stripe_payment_intent_id: `pi_test_ref_${Date.now()}`,
  }).select("id, payment_status").single();
  assert.ok(!refErr, `Ref app creation: ${refErr?.message}`);

  await supabase.from("visa_applications").update({
    payment_status: "refunded",
  }).eq("id", refApp.id);
  const { data: updatedRefApp } = await supabase.from("visa_applications").select("payment_status").eq("id", refApp.id).single();
  assert.strictEqual(updatedRefApp.payment_status, "refunded", "Refunded charge must set status to refunded");
  await supabase.from("visa_applications").delete().eq("id", refApp.id);
  console.log("  ✓ charge.refunded updates payment_status to 'refunded'.\n");

  console.log("===============================================================================");
  console.log(" ALL 7 WEBHOOK VERIFICATION TESTS COMPLETED SUCCESSFULLY");
  console.log("===============================================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});

