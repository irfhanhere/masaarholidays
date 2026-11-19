import fs from "node:fs";
import path from "node:path";

// Load .env.local safely
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const env = (process.env.TAMARA_ENV || "production").toLowerCase().trim();
const apiToken = (process.env.TAMARA_API_TOKEN || "").trim();

console.log("=== TAMARA VERIFICATION RUN ===");
console.log("Environment:", env);
console.log("Token configured:", Boolean(apiToken));

async function verifyLiveSession() {
  const endpoint = "https://api.tamara.co/checkout";
  const testOrderId = `MH-ESIM-TEST-${Date.now().toString().slice(-6)}`;

  const payload = {
    order_reference_id: testOrderId,
    order_number: testOrderId,
    total_amount: {
      amount: 9.99,
      currency: "AED",
    },
    description: "eSIM: Saudi Arabia — 1 GB (7 Days)",
    country_code: "AE",
    payment_type: "PAY_BY_INSTALMENTS",
    instalments: 4,
    shipping_amount: {
      amount: 0,
      currency: "AED",
    },
    tax_amount: {
      amount: 0,
      currency: "AED",
    },
    discount_amount: {
      amount: 0,
      currency: "AED",
    },
    items: [
      {
        reference_id: "P1155",
        type: "digital",
        name: "Saudi Arabia 1 GB / 7 Days",
        sku: "P1155",
        quantity: 1,
        unit_price: {
          amount: 9.99,
          currency: "AED",
        },
        total_amount: {
          amount: 9.99,
          currency: "AED",
        },
        tax_amount: {
          amount: 0,
          currency: "AED",
        },
        discount_amount: {
          amount: 0,
          currency: "AED",
        },
      },
    ],
    consumer: {
      first_name: "Valued",
      last_name: "Customer",
      phone_number: "+971501234567",
      email: "guest@masaarholidays.com",
    },
    shipping_address: {
      first_name: "Valued",
      last_name: "Customer",
      line1: "Business Bay, Masaar Holidays",
      city: "Dubai",
      country_code: "AE",
      phone_number: "+971501234567",
    },
    billing_address: {
      first_name: "Valued",
      last_name: "Customer",
      line1: "Business Bay, Masaar Holidays",
      city: "Dubai",
      country_code: "AE",
      phone_number: "+971501234567",
    },
    merchant_url: {
      success: "https://www.masaarholidays.com/esim/order/test-success?tamara=1",
      failure: "https://www.masaarholidays.com/esim/checkout/P1155?failed=1",
      cancel: "https://www.masaarholidays.com/esim/checkout/P1155?cancelled=1",
      notification: "https://www.masaarholidays.com/api/tamara/webhook",
    },
  };

  console.log(`Sending POST /checkout to ${endpoint}...`);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const correlationId =
    res.headers.get("x-correlation-id") ||
    res.headers.get("x-request-id") ||
    res.headers.get("cf-ray") ||
    "N/A";

  console.log(`Response HTTP Status: ${res.status}`);
  console.log(`Correlation ID: ${correlationId}`);

  const text = await res.text();
  console.log("Response Body:", text);

  if (res.ok) {
    const json = JSON.parse(text);
    console.log("\n✅ SUCCESS: Checkout session successfully created on Tamara Production!");
    console.log("Order ID:", json.order_id);
    console.log("Checkout ID:", json.checkout_id);
    console.log("Checkout URL:", json.checkout_url);
  } else {
    console.error("\n❌ FAILED: Checkout creation failed with status:", res.status);
  }
}

verifyLiveSession();
