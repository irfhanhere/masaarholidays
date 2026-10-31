import assert from "node:assert/strict";

async function run() {
  const secretKey = process.env.TABBY_SECRET_KEY;
  const merchantCode = process.env.TABBY_MERCHANT_CODE || "mhae";

  if (!secretKey) {
    console.error("TABBY_SECRET_KEY is missing from environment.");
    process.exit(1);
  }

  console.log("Testing Tabby checkout session generation with sandbox keys...");
  console.log("Merchant Code:", merchantCode);
  console.log("Key format valid:", secretKey.startsWith("sk_test_"));

  // 1. UAE Visa (AED)
  console.log("\n--- Scenario 1: UAE Visa Checkout (AED 440.70) ---");
  const aedPayload = {
    payment: {
      amount: "440.70",
      currency: "AED",
      description: "Masaar Holidays: UAE Visa 30 Days (Test Ref MH-UAE-TEST)",
      buyer: {
        phone: "+971501234567",
        email: "guest@masaarholidays.com",
        name: "Test UAE Guest",
      },
      buyer_history: {
        registered_since: new Date().toISOString(),
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: "MH-UAE-TEST",
        items: [
          {
            title: "UAE Tourist Visa (30 Days)",
            description: "UAE Tourist Visa 30 Days Single Entry",
            quantity: 1,
            unit_price: "440.70",
            category: "Visa Services",
            reference_id: "prod_uae_30d",
          },
        ],
      },
      order_history: [],
      shipping_address: {
        city: "Dubai",
        address: "Al Barsha",
        zip: "00000",
      },
    },
    lang: "en",
    merchant_code: merchantCode,
    merchant_urls: {
      success: "https://www.masaarholidays.com/visa/application/tok_test_aed?payment_id={payment_id}&tabby=1",
      cancel: "https://www.masaarholidays.com/visa/uae/apply?cancelled=1",
      failure: "https://www.masaarholidays.com/visa/uae/apply?failed=1",
    },
  };

  const aedRes = await fetch("https://api.tabby.ai/api/v2/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(aedPayload),
  });

  const aedData = await aedRes.json();
  console.log("AED Status HTTP:", aedRes.status);
  if (aedRes.ok) {
    console.log("AED Session ID:", aedData.id);
    console.log("AED Payment ID:", aedData.payment?.id);
    console.log("AED Status:", aedData.status);
    console.log("AED Web URL generated:", Boolean(aedData.configuration?.available_products?.installments?.[0]?.web_url));
  } else {
    console.error("AED Error:", aedData);
  }

  // 2. Saudi Tourist Visa (SAR)
  console.log("\n--- Scenario 2: Saudi Tourist Visa Checkout (SAR 825.00) ---");
  const sarPayload = {
    payment: {
      amount: "825.00",
      currency: "SAR",
      description: "Masaar Holidays: Saudi Tourist Visa (Test Ref MH-SAR-TEST)",
      buyer: {
        phone: "+966501234567",
        email: "guest@masaarholidays.com",
        name: "Test Saudi Guest",
      },
      buyer_history: {
        registered_since: new Date().toISOString(),
        loyalty_level: 0,
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: new Date().toISOString(),
        reference_id: "MH-SAR-TEST",
        items: [
          {
            title: "Saudi Tourist Visa (90 Days)",
            description: "Saudi Tourist Visa Multiple Entry",
            quantity: 1,
            unit_price: "825.00",
            category: "Visa Services",
            reference_id: "prod_saudi_90d",
          },
        ],
      },
      order_history: [],
      shipping_address: {
        city: "Riyadh",
        address: "King Fahd Road",
        zip: "11564",
      },
    },
    lang: "en",
    merchant_code: merchantCode,
    merchant_urls: {
      success: "https://www.masaarholidays.com/visa/application/tok_test_sar?payment_id={payment_id}&tabby=1",
      cancel: "https://www.masaarholidays.com/visa/saudi-tourist/apply?cancelled=1",
      failure: "https://www.masaarholidays.com/visa/saudi-tourist/apply?failed=1",
    },
  };

  const sarRes = await fetch("https://api.tabby.ai/api/v2/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(sarPayload),
  });

  const sarData = await sarRes.json();
  console.log("SAR Status HTTP:", sarRes.status);
  if (sarRes.ok) {
    console.log("SAR Session ID:", sarData.id);
    console.log("SAR Payment ID:", sarData.payment?.id);
    console.log("SAR Status:", sarData.status);
    console.log("SAR Web URL generated:", Boolean(sarData.configuration?.available_products?.installments?.[0]?.web_url));
    if (sarData.configuration?.products?.installments?.rejection_reason) {
      console.log("SAR Installment Rejection Reason:", sarData.configuration.products.installments.rejection_reason);
    }
  } else {
    console.log("SAR Error Response:", sarData);
  }
}

run().catch((e) => {
  console.error("Test failed with exception:", e);
  process.exit(1);
});
