import assert from "node:assert";
import fs from "node:fs";

// Load .env.local into process.env
try {
  if (fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // ignore
}

async function runEmailTests() {
  console.log("\nTesting Email validation and default recipient in actions.ts...");

  const { getDefaultVisaOperationsEmailAction, sendVisaDocumentsEmailAction } = await import(
    "../src/app/admin/(dashboard)/visa-applications/actions.ts"
  );

  // 1. Default recipient email
  const defaultEmail = await getDefaultVisaOperationsEmailAction();
  assert.ok(defaultEmail && defaultEmail.includes("@"), `Default operations email must be valid, got: ${defaultEmail}`);
  console.log(`   ✓ Default visa operations recipient: ${defaultEmail}`);

  // 2. Invalid recipient email rejection
  const invalidEmailResult = await sendVisaDocumentsEmailAction({
    applicationId: "00000000-0000-0000-0000-000000000000",
    recipient: "not-an-email",
    deliveryMethod: "link",
    selectedDocIds: [],
  });
  assert.strictEqual(invalidEmailResult.success, false, "Must reject invalid recipient email format");
  assert.ok(invalidEmailResult.error?.includes("Invalid recipient"), `Error message must mention invalid recipient: ${invalidEmailResult.error}`);
  console.log("   ✓ Invalid recipient email format properly rejected.");

  // 3. Invalid CC email rejection
  const invalidCcResult = await sendVisaDocumentsEmailAction({
    applicationId: "00000000-0000-0000-0000-000000000000",
    recipient: "care@masaarholidays.com",
    cc: "invalid-cc-email",
    deliveryMethod: "link",
    selectedDocIds: [],
  });
  assert.strictEqual(invalidCcResult.success, false, "Must reject invalid CC email format");
  assert.ok(invalidCcResult.error?.includes("Invalid CC email"), `Error message must mention invalid CC: ${invalidCcResult.error}`);
  console.log("   ✓ Invalid CC email format properly rejected.");

  console.log("\n✓ All email validation tests passed!\n");
}

runEmailTests().catch((err) => {
  console.error("❌ Email test failed:", err);
  process.exit(1);
});
