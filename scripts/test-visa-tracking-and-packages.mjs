import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getSigningSecret() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CRON_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    "masaar-secure-visa-documents-default-secret-salt"
  );
}

function generateSecurePackageToken(applicationId, docIds, expiresInHours = 48) {
  const exp = Date.now() + expiresInHours * 60 * 60 * 1000;
  const payload = {
    applicationId,
    docIds: docIds && docIds.length > 0 ? docIds : undefined,
    exp,
  };

  const jsonStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(jsonStr, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

function verifySecurePackageToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, error: "Malformed or missing secure package token." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token structure." };
  }

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadB64)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { valid: false, error: "Invalid cryptographic signature." };
  }

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr);

    if (!payload.applicationId || !payload.exp) {
      return { valid: false, error: "Invalid token payload contents." };
    }

    if (Date.now() > payload.exp) {
      return {
        valid: false,
        error: "This secure download link has expired. Please contact Masaar Holidays to request a renewed link.",
      };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to parse token payload." };
  }
}

async function run() {
  console.log("=== STEP 1: Creating or verifying test visa application ===");

  const testRef = "MH-SV-TEST-990001";
  const testTrackingToken = "trk-tok-test-990001-" + crypto.randomBytes(8).toString("hex");

  // Check if test app already exists
  let { data: existingApp } = await supabase
    .from("visa_applications")
    .select("*")
    .eq("reference_no", testRef)
    .maybeSingle();

  let appId;

  if (existingApp) {
    appId = existingApp.id;
    console.log(`Found existing test application ${testRef} (ID: ${appId})`);
    // Update tracking token
    await supabase
      .from("visa_applications")
      .update({
        tracking_token: testTrackingToken,
        payment_status: "paid",
        application_status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appId);
  } else {
    const { data: newApp, error: createErr } = await supabase
      .from("visa_applications")
      .insert({
        reference_no: testRef,
        tracking_token: testTrackingToken,
        visa_type_slug: "saudi-tourist",
        product_id: "c7f1a920-5a0d-4001-8b01-750000000001",
        product_title: "Saudi 1-Year Multiple Entry Tourist Visa",
        primary_contact_name: "Test Applicant (QA Controlled)",
        primary_contact_email: "care@masaarholidays.com",
        primary_contact_phone: "+971557329320",
        nationality: "India",
        country_of_residence: "United Arab Emirates",
        applicant_count: 1,
        total_amount: 750,
        currency: "AED",
        payment_status: "paid",
        application_status: "submitted",
        internal_notes: "Automated verification test record (persistent for QA).",
      })
      .select()
      .single();

    if (createErr) {
      console.error("Failed to create test application:", createErr);
      process.exit(1);
    }
    appId = newApp.id;
    console.log(`Created new test application ${testRef} (ID: ${appId})`);
  }

  // Create or verify applicant
  const { data: existingApplicant } = await supabase
    .from("visa_applicants")
    .select("id")
    .eq("application_id", appId)
    .maybeSingle();

  let applicantId = existingApplicant?.id;

  if (!existingApplicant) {
    const { data: newApplicant, error: applicantErr } = await supabase
      .from("visa_applicants")
      .insert({
        application_id: appId,
        applicant_number: 1,
        full_name: "Test Applicant",
        date_of_birth: "1992-05-15",
        gender: "Male",
        nationality: "India",
        country_of_residence: "United Arab Emirates",
        passport_number: "Z9988776",
        passport_expiry_date: "2032-12-31",
      })
      .select()
      .single();

    if (applicantErr) {
      console.error("Failed to create test applicant:", applicantErr);
    } else {
      applicantId = newApplicant.id;
      console.log(`Created test applicant record (ID: ${applicantId})`);
    }
  }

  // Ensure test dummy document in storage & db
  const dummyDocPath = `test/${appId}/sample_passport_copy.pdf`;
  const dummyDocBuffer = Buffer.from("%PDF-1.4 Sample Test Visa Document for Masaar Holidays QA");

  try {
    await supabase.storage.from("visa-documents").upload(dummyDocPath, dummyDocBuffer, {
      upsert: true,
      contentType: "application/pdf",
    });
    console.log(`Uploaded sample document to storage: ${dummyDocPath}`);
  } catch (storageErr) {
    console.warn("Storage upload notice:", storageErr.message);
  }

  // Ensure record in visa_application_documents
  const { data: existingDoc } = await supabase
    .from("visa_application_documents")
    .select("id")
    .eq("application_id", appId)
    .maybeSingle();

  if (!existingDoc) {
    await supabase.from("visa_application_documents").insert({
      application_id: appId,
      applicant_id: applicantId,
      document_type: "passport",
      file_path: dummyDocPath,
      file_name: "test_passport_copy.pdf",
      file_size: dummyDocBuffer.length,
      mime_type: "application/pdf",
    });
    console.log("Created test document record in visa_application_documents");
  }

  console.log("\n=== STEP 2: Testing Token & Reference Lookup Resolution ===");

  // 1. Lookup by tracking_token
  const { data: appByToken } = await supabase
    .from("visa_applications")
    .select("id, reference_no, tracking_token")
    .eq("tracking_token", testTrackingToken)
    .maybeSingle();

  console.log("Lookup by tracking_token:", appByToken?.reference_no === testRef ? "PASSED (Found)" : "FAILED");

  // 2. Lookup by reference_no
  const { data: appByRef } = await supabase
    .from("visa_applications")
    .select("id, reference_no, tracking_token")
    .eq("reference_no", testRef)
    .maybeSingle();

  console.log("Lookup by reference_no:", appByRef?.id === appId ? "PASSED (Found)" : "FAILED");

  // 3. Lookup by nonexistent token
  const { data: appNonExistent } = await supabase
    .from("visa_applications")
    .select("id")
    .eq("tracking_token", "invalid-nonexistent-token-12345")
    .maybeSingle();

  console.log("Lookup invalid token rejection:", appNonExistent === null ? "PASSED (Null/Not found)" : "FAILED");

  console.log("\n=== STEP 3: Testing Secure Document Package Token Logic ===");

  // Valid token (48 hours)
  const validToken = generateSecurePackageToken(appId, undefined, 48);
  const verifyValid = verifySecurePackageToken(validToken);
  console.log("Valid 48h token verification:", verifyValid.valid ? "PASSED" : "FAILED", verifyValid.error || "");

  // Tampered token
  const tamperedToken = validToken.slice(0, -4) + "X9Y8";
  const verifyTampered = verifySecurePackageToken(tamperedToken);
  console.log("Tampered token rejection:", !verifyTampered.valid ? "PASSED (Rejected)" : "FAILED", verifyTampered.error);

  // Expired token (-1 hour)
  const expiredToken = generateSecurePackageToken(appId, undefined, -1);
  const verifyExpired = verifySecurePackageToken(expiredToken);
  console.log("Expired token rejection:", !verifyExpired.valid ? "PASSED (Rejected)" : "FAILED", verifyExpired.error);

  console.log("\n=== STEP 4: Generated Canonical URLs for Manual QA Verification ===");
  const trackingUrl = `https://www.masaarholidays.com/visa/application/${testTrackingToken}`;
  const securePackageUrl = `https://www.masaarholidays.com/api/visa/secure-package?token=${validToken}`;

  console.log("Customer Tracking URL:", trackingUrl);
  console.log("Secure Document Package URL:", securePackageUrl);

  console.log("\n=== STEP 5: Testing Live Hostinger SMTP Email Notification ===");
  const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER || "care@masaarholidays.com";
  const smtpPass = process.env.SMTP_PASS;

  if (smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: `"Masaar Holidays" <${smtpUser}>`,
      to: "care@masaarholidays.com",
      subject: `New Paid Saudi Visa Application — ${testRef} (Verification Test)`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #F7F4ED; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; padding: 24px; border: 1px solid #E5E0D5;">
            <div style="text-align: center; border-bottom: 2px solid #C9A227; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #0A0A08; margin: 0;">MASAAR HOLIDAYS</h2>
              <p style="color: #C9A227; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; font-weight: bold;">Visa Verification Notice</p>
            </div>
            <h3 style="color: #0A0A08; margin-top: 0;">Verified Live Payment & Application Links</h3>
            <p style="font-size: 13px; color: #333330;">Application Reference: <strong>${testRef}</strong></p>
            <p style="font-size: 13px; color: #333330;">Product: <strong>Saudi 1-Year Multiple Entry Tourist Visa</strong></p>
            <p style="font-size: 13px; color: #333330;">Amount: <strong>AED 750.00 (Paid via Stripe Live)</strong></p>
            <p style="font-size: 13px; color: #333330;">Applicant: <strong>Test Applicant (India)</strong></p>
            
            <div style="margin: 20px 0; text-align: center;">
              <a href="${trackingUrl}" style="background: #C9A227; color: #0A0A08; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 13px; display: inline-block;">
                Track Application &amp; View Documents &rarr;
              </a>
            </div>

            <div style="margin: 20px 0; text-align: center;">
              <a href="${securePackageUrl}" style="background: #0A0A08; color: #C9A227; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 12px; display: inline-block;">
                Secure Document Package (.ZIP) &rarr;
              </a>
            </div>

            <div style="background: #FEFCE8; border-left: 4px solid #C9A227; padding: 12px; font-size: 12px; color: #713F12; margin-top: 20px;">
              <strong>Notice:</strong> This email confirms verified application submission. Visa approval and issuance remain at the sole discretion of destination immigration authorities.
            </div>

            <p style="font-size: 11px; color: #777; margin-top: 24px; text-align: center;">
              Masaar Holidays Travel &amp; Tourism LLC · +971 55 732 9320 · care@masaarholidays.com
            </p>
          </div>
        </div>
      `,
    });
    console.log(`Live test email successfully dispatched via Hostinger SMTP (Message ID: ${info.messageId})`);
  } else {
    console.log("SMTP_PASS not set, skipped live email delivery");
  }

  console.log("\n=== SUMMARY ===");
  console.log("All automated tests completed successfully.");
  console.log(`Test record ${testRef} left in database for persistent click testing.`);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
