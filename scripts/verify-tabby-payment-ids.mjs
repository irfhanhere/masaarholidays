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
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const secretKey = process.env.TABBY_SECRET_KEY;
const baseUrl = process.env.TABBY_BASE_URL || "https://api.tabby.ai";

const paymentIds = [
  { label: "Success Session Payment ID", id: "01a1f461-3248-8dda-b00d-47bad7bb3036" },
  { label: "Pre-Scoring Rejection Payment ID", id: "01a1f461-3248-8240-8d0a-e0d9368c70cc" },
  { label: "HPP Rejection Payment ID", id: "01a1f461-3630-83ab-950c-6fcba0c48d65" },
  { label: "Cancellation Payment ID", id: "01a1f461-3630-8240-bd0b-e6b24fc79458" },
];

async function verifyPaymentIds() {
  console.log("=== TABBY SANDBOX PAYMENT ID VERIFICATION ===\n");

  for (const item of paymentIds) {
    console.log(`Checking ${item.label}: ${item.id}...`);
    try {
      const url = `${baseUrl}/api/v2/payments/${encodeURIComponent(item.id)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: "application/json",
        },
      });

      console.log(`  HTTP Status: ${res.status}`);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (res.ok) {
          console.log(`  Exists in Sandbox: YES`);
          console.log(`  Status: ${json.status}`);
          console.log(`  Amount: ${json.amount} ${json.currency}`);
          console.log(`  Reference ID: ${json.order?.reference_id || "none"}`);
          console.log(`  Created At: ${json.created_at}`);
          console.log(`  Expires At: ${json.expires_at || "N/A"}`);
          console.log(`  Captures: ${JSON.stringify(json.captures || [])}`);
          console.log(`  Refunds: ${JSON.stringify(json.refunds || [])}`);
          console.log(`  Buyer: Name=${json.buyer?.name}, Phone=${json.buyer?.phone}, Email=${json.buyer?.email}`);
        } else {
          console.log(`  Exists in Sandbox: NO / ERROR`);
          console.log(`  Error Payload: ${text}`);
        }
      } catch {
        console.log(`  Raw Response: ${text}`);
      }
    } catch (err) {
      console.error(`  Fetch failed: ${err.message}`);
    }
    console.log("--------------------------------------------------");
  }
}

verifyPaymentIds();
