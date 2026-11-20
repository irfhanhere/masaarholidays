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

console.log("=== TABBY OFFICIAL QA SCENARIO TEST SUITE ===");
console.log("Target Base URL:", baseUrl);
console.log("Merchant Code:", merchantCode);
console.log("Secret Key Present:", Boolean(secretKey));

async function createTabbySession(buyer, description, referenceId, amountAed = "120.00") {
  const payload = {
    payment: {
      amount: amountAed,
      currency: "AED",
      description: description,
      buyer: {
        phone: buyer.phone,
        email: buyer.email,
        name: buyer.name,
      },
      buyer_history: {
        registered_since: "2024-01-01T00:00:00.000Z",
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: referenceId,
        items: [
          {
            title: description,
            description: description,
            quantity: 1,
            unit_price: amountAed,
            category: "Travel Services",
            reference_id: referenceId,
          },
        ],
      },
      order_history: [],
      shipping_address: {
        city: "Dubai",
        address: "Business Bay",
        zip: "00000",
      },
    },
    lang: "en",
    merchant_code: merchantCode,
    merchant_urls: {
      success: `https://www.masaarholidays.com/visa/application/tok_test?payment_id={payment_id}&tabby=1`,
      cancel: `https://www.masaarholidays.com/visa/uae/apply?cancelled=1`,
      failure: `https://www.masaarholidays.com/visa/uae/apply?failed=1`,
    },
  };

  const res = await fetch(`${baseUrl}/api/v2/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  return { status: res.status, ok: res.ok, data: json };
}

async function runQaScenarios() {
  const timestamp = Date.now().toString().slice(-6);

  // 1. Success Scenario
  console.log("\n------------------------------------------------------------");
  console.log("SCENARIO 1: Success Flow");
  console.log("Credentials: otp.success@tabby.ai | +971500000001 | OTP: 8888");
  const ref1 = `MH-QA-SUCC-${timestamp}`;
  const res1 = await createTabbySession(
    { name: "Tabby QA Success", email: "otp.success@tabby.ai", phone: "+971500000001" },
    "Masaar Holidays: Saudi Tourist Visa (QA Success)",
    ref1,
    "750.00"
  );
  console.log("HTTP Status:", res1.status);
  if (res1.ok) {
    console.log("Session ID:", res1.data.id);
    console.log("Payment ID:", res1.data.payment?.id);
    console.log("Initial Payment Status:", res1.data.status || res1.data.payment?.status);
    const installments = res1.data.configuration?.available_products?.installments?.[0];
    console.log("Web URL Available:", Boolean(installments?.web_url));
    console.log("Web URL:", installments?.web_url);
    console.log("Installment Amount:", installments?.downpayment_total);
  } else {
    console.error("Scenario 1 Error:", res1.data);
  }

  // 2. Background Pre-scoring Rejection Scenario
  console.log("\n------------------------------------------------------------");
  console.log("SCENARIO 2: Background Pre-Scoring Rejection");
  console.log("Credentials: otp.success@tabby.ai | +971500000002");
  const ref2 = `MH-QA-PRESC-${timestamp}`;
  const res2 = await createTabbySession(
    { name: "Tabby QA PreScore Rejection", email: "otp.success@tabby.ai", phone: "+971500000002" },
    "Masaar Holidays: Private Transfer (QA PreScore Rejection)",
    ref2,
    "450.00"
  );
  console.log("HTTP Status:", res2.status);
  console.log("Response Body:", JSON.stringify(res2.data, null, 2));
  const rejectedProd = res2.data.configuration?.products?.installments;
  console.log("Products Rejection Status:", {
    status: res2.data.status,
    installmentsAvailable: Boolean(res2.data.configuration?.available_products?.installments?.length),
    rejectionReason: rejectedProd?.rejection_reason || res2.data.rejection_reason,
  });

  // 3. Hosted Payment Page Rejection Scenario
  console.log("\n------------------------------------------------------------");
  console.log("SCENARIO 3: Hosted Payment Page Rejection");
  console.log("Credentials: otp.rejected@tabby.ai | +971500000001 | OTP: 8888");
  const ref3 = `MH-QA-HPP-REJ-${timestamp}`;
  const res3 = await createTabbySession(
    { name: "Tabby QA HPP Rejection", email: "otp.rejected@tabby.ai", phone: "+971500000001" },
    "Masaar Holidays: eSIM 10GB 30Days (QA HPP Rejection)",
    ref3,
    "66.11"
  );
  console.log("HTTP Status:", res3.status);
  if (res3.ok) {
    console.log("Session ID:", res3.data.id);
    console.log("Payment ID:", res3.data.payment?.id);
    console.log("Initial Payment Status:", res3.data.status || res3.data.payment?.status);
    const installments = res3.data.configuration?.available_products?.installments?.[0];
    console.log("Web URL Available:", Boolean(installments?.web_url));
    console.log("Web URL:", installments?.web_url);
    console.log("Note: On this URL, entering OTP 8888 triggers the rejection screen from Tabby.");
  } else {
    console.error("Scenario 3 Error:", res3.data);
  }

  // 4. Cancellation Scenario
  console.log("\n------------------------------------------------------------");
  console.log("SCENARIO 4: Cancellation Flow");
  console.log("Credentials: otp.success@tabby.ai | +971500000001");
  const ref4 = `MH-QA-CANCEL-${timestamp}`;
  const res4 = await createTabbySession(
    { name: "Tabby QA Cancellation", email: "otp.success@tabby.ai", phone: "+971500000001" },
    "Masaar Holidays: Worldwide Visa (QA Cancellation)",
    ref4,
    "440.70"
  );
  console.log("HTTP Status:", res4.status);
  if (res4.ok) {
    console.log("Session ID:", res4.data.id);
    console.log("Payment ID:", res4.data.payment?.id);
    const installments = res4.data.configuration?.available_products?.installments?.[0];
    console.log("Web URL:", installments?.web_url);
    console.log("Cancellation URL Configured:", res4.data.payment?.cancel_url || "https://www.masaarholidays.com/visa/uae/apply?cancelled=1");
  }

  // 5. Querying payment details via GET /api/v2/payments/{id}
  if (res1.ok && res1.data.payment?.id) {
    console.log("\n------------------------------------------------------------");
    console.log("SCENARIO 5: Probing GET /api/v2/payments/{id} with Payment ID:", res1.data.payment.id);
    const getRes = await fetch(`${baseUrl}/api/v2/payments/${res1.data.payment.id}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
    });
    console.log("GET Payment HTTP Status:", getRes.status);
    const getData = await getRes.json();
    console.log("Payment Status:", getData.status);
    console.log("Amount:", getData.amount, getData.currency);
    console.log("Order Ref:", getData.order?.reference_id);
    console.log("Captures:", getData.captures || []);
    console.log("Refunds:", getData.refunds || []);
  }
}

runQaScenarios();
