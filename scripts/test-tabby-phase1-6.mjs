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

const secretKey = process.env.TABBY_SECRET_KEY;
const merchantCode = process.env.TABBY_MERCHANT_CODE || "mhae";
const baseUrl = process.env.TABBY_BASE_URL || "https://api.tabby.ai";

console.log("================================================================================");
console.log("TABBY PHASE 1–6 AUTOMATED VERIFICATION SUITE");
console.log("Base URL:", baseUrl);
console.log("Merchant:", merchantCode, "(Masaar Holidays FZE LLC)");
console.log("Environment:", process.env.TABBY_ENVIRONMENT || "sandbox");
console.log("================================================================================\n");

async function runTest(testName, payload) {
  console.log(`>>> Running: ${testName}`);
  try {
    const res = await fetch(`${baseUrl}/api/v2/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function executeSuite() {
  const ts = Date.now().toString().slice(-6);

  // 1. AED 25,000 Limit Test
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 1: AED 25,000 LIMIT STRESS TEST");
  console.log("Verifies how Tabby sandbox handles an order exceeding typical BNPL limits.");
  const resLimit = await runTest("AED 25,000 Checkout Session", {
    payment: {
      amount: "25000.00",
      currency: "AED",
      description: "Tabby Sandbox Limit Stress Test Product (AED 25,000)",
      buyer: {
        name: "Tabby QA Tester",
        email: "qa-limit-test@tabby.ai",
        phone: "+971500000001",
      },
      buyer_history: {
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: `QA-LIMIT-TEST-${ts}`,
        items: [
          {
            title: "High-Value Limit Test",
            quantity: 1,
            unit_price: "25000.00",
            category: "QA Test",
            reference_id: `QA-LIMIT-TEST-${ts}`,
          },
        ],
      },
      order_history: [],
      shipping_address: { city: "Dubai", address: "Business Bay", zip: "00000" },
    },
    lang: "en",
    merchant_code: merchantCode,
    merchant_urls: {
      success: "https://www.masaarholidays.com/qa/tabby-test-limit?success=1",
      cancel: "https://www.masaarholidays.com/qa/tabby-test-limit?cancelled=1",
      failure: "https://www.masaarholidays.com/qa/tabby-test-limit?failed=1",
    },
  });

  console.log("HTTP Status:", resLimit.status);
  const installmentsProd = resLimit.data?.configuration?.products?.installments;
  const availableInstallments = resLimit.data?.configuration?.available_products?.installments;
  const isAvailable = Boolean(availableInstallments && availableInstallments.length > 0);
  console.log("Session Status:", resLimit.data?.status);
  console.log("Installments Available:", isAvailable);
  console.log("Product Rejection Reason:", installmentsProd?.rejection_reason || resLimit.data?.rejection_reason || "None");
  console.log("Session Web URL:", availableInstallments?.[0]?.web_url || "NONE (Correctly blocked/restricted by Tabby)");

  // 2. Standard Approved Checkout (AED 750)
  console.log("\n--------------------------------------------------------------------------------");
  console.log("TEST 2: STANDARD APPROVED CHECKOUT (AED 750.00)");
  console.log("Verifies clean session creation with official Tabby parameters.");
  const resSuccess = await runTest("Standard Approved Checkout", {
    payment: {
      amount: "750.00",
      currency: "AED",
      description: "Masaar Holidays: Saudi Tourist Visa (QA Verification)",
      buyer: {
        name: "Tabby QA Success",
        email: "otp.success@tabby.ai",
        phone: "+971500000001",
      },
      buyer_history: {
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: `QA-SUCC-${ts}`,
        items: [
          {
            title: "Saudi Tourist Visa",
            quantity: 1,
            unit_price: "750.00",
            category: "Visa Services",
            reference_id: `QA-SUCC-${ts}`,
          },
        ],
      },
      order_history: [],
      shipping_address: { city: "Dubai", address: "Business Bay", zip: "00000" },
    },
    lang: "en",
    merchant_code: merchantCode,
    merchant_urls: {
      success: "https://www.masaarholidays.com/visa/tracking?payment_id={payment_id}&tabby=1",
      cancel: "https://www.masaarholidays.com/saudi-visa?cancelled=1",
      failure: "https://www.masaarholidays.com/saudi-visa?failed=1",
    },
  });

  console.log("HTTP Status:", resSuccess.status);
  console.log("Session ID:", resSuccess.data?.id);
  console.log("Payment ID:", resSuccess.data?.payment?.id);
  console.log("Payment Status:", resSuccess.data?.payment?.status);
  const succUrl = resSuccess.data?.configuration?.available_products?.installments?.[0]?.web_url;
  console.log("Hosted Web URL Present:", Boolean(succUrl));
  console.log("Web URL:", succUrl ? succUrl.slice(0, 80) + "..." : "NONE");

  // 3. Official Pre-Scoring Rejection (+971500000002)
  console.log("\n--------------------------------------------------------------------------------");
  console.log("TEST 3: TABBY PRE-SCORING REJECTION (+971500000002)");
  console.log("Verifies server-side rejection parsing and approved customer message.");
  const resPreScore = await runTest("Official Pre-Scoring Rejection", {
    payment: {
      amount: "450.00",
      currency: "AED",
      description: "Masaar Holidays: Private Transfer (QA Rejection)",
      buyer: {
        name: "Tabby QA Rejected",
        email: "otp.success@tabby.ai",
        phone: "+971500000002",
      },
      buyer_history: {
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: `QA-REJ-${ts}`,
        items: [
          {
            title: "Private Airport Transfer",
            quantity: 1,
            unit_price: "450.00",
            category: "Transfers",
            reference_id: `QA-REJ-${ts}`,
          },
        ],
      },
      order_history: [],
      shipping_address: { city: "Dubai", address: "Business Bay", zip: "00000" },
    },
    lang: "en",
    merchant_code: merchantCode,
    merchant_urls: {
      success: "https://www.masaarholidays.com/transfers?payment_id={payment_id}",
      cancel: "https://www.masaarholidays.com/transfers?cancelled=1",
      failure: "https://www.masaarholidays.com/transfers?failed=1",
    },
  });

  console.log("HTTP Status:", resPreScore.status);
  console.log("Session Status:", resPreScore.data?.status);
  const rejReason = resPreScore.data?.configuration?.products?.installments?.rejection_reason || resPreScore.data?.rejection_reason;
  console.log("Rejection Reason:", rejReason);
  console.log("Installments Available:", Boolean(resPreScore.data?.configuration?.available_products?.installments?.length));

  // 4. Amount Too Low Test (AED 1.00)
  console.log("\n--------------------------------------------------------------------------------");
  console.log("TEST 4: AMOUNT TOO LOW (AED 1.00)");
  console.log("Verifies Tabby minimum order amount response.");
  const resLow = await runTest("Amount Too Low (AED 1.00)", {
    payment: {
      amount: "1.00",
      currency: "AED",
      description: "Masaar Holidays: Micro Test (AED 1.00)",
      buyer: {
        name: "Tabby QA Low Amount",
        email: "otp.success@tabby.ai",
        phone: "+971500000001",
      },
      buyer_history: {
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: `QA-LOW-${ts}`,
        items: [
          {
            title: "Micro Test",
            quantity: 1,
            unit_price: "1.00",
            category: "QA",
            reference_id: `QA-LOW-${ts}`,
          },
        ],
      },
      order_history: [],
      shipping_address: { city: "Dubai", address: "Business Bay", zip: "00000" },
    },
    lang: "en",
    merchant_code: merchantCode,
    merchant_urls: {
      success: "https://www.masaarholidays.com/qa?success=1",
      cancel: "https://www.masaarholidays.com/qa?cancelled=1",
      failure: "https://www.masaarholidays.com/qa?failed=1",
    },
  });

  console.log("HTTP Status:", resLow.status);
  console.log("Session Status:", resLow.data?.status);
  console.log("Rejection Reason:", resLow.data?.configuration?.products?.installments?.rejection_reason || resLow.data?.rejection_reason || "None");
  console.log("Installments Available:", Boolean(resLow.data?.configuration?.available_products?.installments?.length));

  console.log("\n================================================================================");
  console.log("AUTOMATED SUITE COMPLETE");
  console.log("================================================================================");
}

executeSuite().catch((err) => {
  console.error("Execution failed:", err);
});
