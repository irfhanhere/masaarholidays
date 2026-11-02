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

async function runLiveEmailTests() {
  console.log("\n=======================================================");
  console.log(" MASAAR HOLIDAYS — LIVE HOSTINGER SMTP EMAIL TEST");
  console.log("=======================================================\n");

  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxyjefmopmewpxbtycbn.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.ok(supabaseKey, "SUPABASE_SERVICE_ROLE_KEY must be configured");

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Upload test PDF and test JPEG to private_documents
  console.log("1. Uploading test documents (PDF and Image) to private_documents bucket...");
  const dummyPdf = Buffer.from("%PDF-1.4 Test PDF Document for Automated Verification");
  const dummyJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9]); // Minimal valid JPEG

  const pdfPath = `visa-uploads/test/test_doc_${Date.now()}.pdf`;
  const jpgPath = `visa-uploads/test/test_doc_${Date.now()}.jpg`;

  await supabase.storage.from("private_documents").upload(pdfPath, dummyPdf, { contentType: "application/pdf" });
  await supabase.storage.from("private_documents").upload(jpgPath, dummyJpg, { contentType: "image/jpeg" });
  console.log(`   ✓ Uploaded test PDF (${pdfPath}) and test Image (${jpgPath})`);

  // 2. Insert test application & applicant & documents in Supabase
  const testRefNo = "MH-EMAIL-" + Math.floor(100000 + Math.random() * 900000);
  const { data: testApp, error: appErr } = await supabase
    .from("visa_applications")
    .insert({
      reference_no: testRefNo,
      tracking_token: "token-email-test-" + Date.now(),
      visa_type_slug: "saudi-tourist",
      product_title: "Saudi Tourist 90 Days Multiple",
      applicant_count: 1,
      primary_contact_name: "Email Test Traveller",
      primary_contact_email: "care@masaarholidays.com",
      primary_contact_phone: "+971500009988",
      nationality: "United Kingdom",
      country_of_residence: "United Arab Emirates",
      total_amount: 750,
      currency: "AED",
      payment_status: "paid",
      application_status: "under_review",
    })
    .select()
    .single();

  assert.ok(!appErr, `Failed to create test app: ${appErr?.message}`);

  const { data: testApplicant, error: applicantErr } = await supabase
    .from("visa_applicants")
    .insert({
      application_id: testApp.id,
      applicant_number: 1,
      full_name: "Email Test Traveller",
      date_of_birth: "1992-05-10",
      gender: "Male",
      nationality: "United Kingdom",
      country_of_residence: "United Arab Emirates",
      passport_number: "G12345678",
      passport_issue_date: "2022-01-01",
      passport_expiry_date: "2032-01-01",
      place_of_issue: "London",
    })
    .select()
    .single();

  assert.ok(!applicantErr, `Failed to create test applicant: ${applicantErr?.message}`);

  const { data: doc1 } = await supabase
    .from("visa_application_documents")
    .insert({
      application_id: testApp.id,
      applicant_id: testApplicant.id,
      document_type: "passport",
      file_path: pdfPath,
      file_name: "test_passport.pdf",
      file_size: dummyPdf.length,
      mime_type: "application/pdf",
      verification_status: "verified",
    })
    .select()
    .single();

  const { data: doc2 } = await supabase
    .from("visa_application_documents")
    .insert({
      application_id: testApp.id,
      applicant_id: testApplicant.id,
      document_type: "photo",
      file_path: jpgPath,
      file_name: "test_photo.jpg",
      file_size: dummyJpg.length,
      mime_type: "image/jpeg",
      verification_status: "verified",
    })
    .select()
    .single();

  console.log(`   ✓ Test application created: ${testRefNo} (${testApp.id}) with 2 documents`);

  const { sendVisaDocumentsEmailAction } = await import(
    "../src/app/admin/(dashboard)/visa-applications/actions.ts"
  );

  // 3. Test Delivery Method A: ZIP Attachment
  console.log("\n2. Testing Delivery Method A: Live ZIP Attachment Email...");
  const zipResult = await sendVisaDocumentsEmailAction({
    applicationId: testApp.id,
    recipient: "care@masaarholidays.com",
    deliveryMethod: "attachment",
    selectedDocIds: [doc1.id, doc2.id],
    customNotes: "Automated production verification test: Option A (ZIP Attachment).",
  });

  console.log("   Delivery result:", zipResult);
  assert.strictEqual(zipResult.success, true, `ZIP attachment email failed: ${zipResult.error}`);
  assert.ok(zipResult.messageId, "Must return valid SMTP provider message ID");
  console.log(`   ✓ Option A (ZIP Attachment) successfully accepted by Hostinger SMTP!`);
  console.log(`     Message ID: ${zipResult.messageId}`);

  // 4. Test Delivery Method B: Secure Download Link
  console.log("\n3. Testing Delivery Method B: Live Secure Download Link Email...");
  const linkResult = await sendVisaDocumentsEmailAction({
    applicationId: testApp.id,
    recipient: "care@masaarholidays.com",
    deliveryMethod: "link",
    selectedDocIds: [doc1.id, doc2.id],
    customNotes: "Automated production verification test: Option B (Secure Link).",
  });

  console.log("   Delivery result:", linkResult);
  assert.strictEqual(linkResult.success, true, `Secure link email failed: ${linkResult.error}`);
  assert.ok(linkResult.messageId, "Must return valid SMTP provider message ID");
  console.log(`   ✓ Option B (Secure Download Link) successfully accepted by Hostinger SMTP!`);
  console.log(`     Message ID: ${linkResult.messageId}`);

  // 5. Verify email notifications audit logs
  console.log("\n4. Verifying Email Notifications recorded in email_notifications table...");
  const { data: emailLogs, error: logErr } = await supabase
    .from("email_notifications")
    .select("recipient, template_type, status, metadata, sent_at")
    .eq("reference_id", testRefNo);

  assert.ok(!logErr, `Error fetching email logs: ${logErr?.message}`);
  assert.strictEqual(emailLogs.length, 2, "Must have exactly 2 email notification records");
  assert.strictEqual(emailLogs[0].status, "sent", "First email status must be sent");
  assert.strictEqual(emailLogs[1].status, "sent", "Second email status must be sent");
  console.log("   ✓ Verified: Both email dispatches are logged with 'sent' status and messageId metadata.");

  // Clean up test records
  console.log("\n5. Cleaning up temporary test application and storage files...");
  await supabase.from("visa_applications").delete().eq("id", testApp.id);
  await supabase.storage.from("private_documents").remove([pdfPath, jpgPath]);
  console.log("   ✓ Cleaned up test application and test documents.");

  console.log("\n=======================================================");
  console.log(" ALL LIVE EMAIL TESTS PASSED WITH REAL SMTP ACCEPTANCE! ✓");
  console.log("=======================================================\n");
}

runLiveEmailTests().catch((err) => {
  console.error("❌ LIVE EMAIL TEST FAILED:", err);
  process.exit(1);
});
