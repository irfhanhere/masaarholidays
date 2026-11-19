import fs from "node:fs";

console.log("=== VERIFYING LIVE PRODUCTION DEPLOYMENT & CHECKOUT ===");

async function verifyLive() {
  const origin = "https://www.masaarholidays.com";

  // 1. Check Tamara config API
  console.log(`\n1. Probing ${origin}/api/tamara/config...`);
  try {
    const res = await fetch(`${origin}/api/tamara/config`);
    console.log(`Status: ${res.status}`);
    const json = await res.json();
    console.log("Config response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Config check error:", err.message);
  }

  // 2. Check eSIM Checkout Page HTML
  console.log(`\n2. Probing ${origin}/esim/checkout/P1155...`);
  try {
    const res = await fetch(`${origin}/esim/checkout/P1155`, {
      headers: {
        "User-Agent": "Masaar-Deployment-Verifier/1.0",
      },
    });
    console.log(`Status: ${res.status}`);
    console.log("Server headers:", {
      server: res.headers.get("server"),
      date: res.headers.get("date"),
      xVercelId: res.headers.get("x-vercel-id"),
      xMatchedPath: res.headers.get("x-matched-path"),
      cacheControl: res.headers.get("cache-control"),
      age: res.headers.get("age"),
    });

    const html = await res.text();
    const hasTamara = html.includes("tamara") || html.includes("Tamara");
    const hasTabby = html.includes("tabby") || html.includes("Tabby");
    const hasStripe = html.includes("stripe") || html.includes("card");
    const hasP1155 = html.includes("P1155") || html.includes("1 GB") || html.includes("7 Days");

    console.log("HTML Inspection Results:", {
      hasTamara,
      hasTabby,
      hasStripe,
      hasP1155,
      htmlLength: html.length,
    });
  } catch (err) {
    console.error("Checkout page check error:", err.message);
  }

  // 3. Test Live eSIM Checkout POST with Tamara
  console.log(`\n3. Testing Live Checkout API: POST ${origin}/api/esim/checkout (Single test order)...`);
  try {
    const payload = {
      planId: "P1155",
      quantity: 1,
      currency: "AED",
      paymentGateway: "tamara",
      fullName: "Masaar Verification",
      email: "qa@masaarholidays.com",
      confirmEmail: "qa@masaarholidays.com",
      phone: "+971501234567",
      termsAccepted: true,
      deviceUnlockedAccepted: true,
      refundDataOnlyAccepted: true,
    };

    const res = await fetch(`${origin}/api/esim/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Masaar-Deployment-Verifier/1.0",
      },
      body: JSON.stringify(payload),
    });

    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log("Checkout response raw text:", text);

    try {
      const data = JSON.parse(text);
      if (res.ok && data.url) {
        console.log("\n🎉 LIVE CHECKOUT VERIFICATION SUCCESSFUL!");
        console.log("Returned Checkout URL:", data.url);
        console.log("Gateway:", data.paymentGateway);
        console.log("Reference ID:", data.referenceId);
        const isTamaraRedirect = data.url.includes("checkout.tamara.co") || data.url.includes("tamara.co");
        console.log("Points to Tamara Hosted Checkout:", isTamaraRedirect);
      } else {
        console.error("\n❌ Checkout creation returned error:", data);
      }
    } catch {
      console.error("Could not parse JSON response from checkout API");
    }
  } catch (err) {
    console.error("Checkout API error:", err.message);
  }

  // 4. Test Webhook Endpoint probe
  console.log(`\n4. Probing Webhook Endpoint ${origin}/api/tamara/webhook...`);
  try {
    // Unauthenticated POST should be rejected with 401 or 400 (Missing / Invalid token or body)
    const res = await fetch(`${origin}/api/tamara/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    console.log(`Unauthenticated webhook response HTTP Status: ${res.status}`);
    const text = await res.text();
    console.log("Webhook response body:", text);
  } catch (err) {
    console.error("Webhook check error:", err.message);
  }
}

verifyLive();
