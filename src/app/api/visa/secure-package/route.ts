import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadPrivateDocument, isSafeStoragePath } from "@/lib/documents/private-storage";
import { createZipArchive, type ZipEntry } from "@/lib/documents/simple-zip";
import { verifySecurePackageToken } from "@/lib/documents/secure-token";
import { logAdminAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return new NextResponse(
      renderHtmlMessage("Missing Token", "A valid secure download token is required to access these documents."),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  const tokenVerification = verifySecurePackageToken(token);
  if (!tokenVerification.valid || !tokenVerification.payload) {
    const isExpired = tokenVerification.error?.toLowerCase().includes("expired");
    return new NextResponse(
      renderHtmlMessage(
        isExpired ? "Link Expired" : "Access Denied",
        tokenVerification.error || "The download link is invalid or has expired. Please contact Masaar Holidays visa operations."
      ),
      { status: isExpired ? 410 : 403, headers: { "Content-Type": "text/html" } }
    );
  }

  const { applicationId, docIds } = tokenVerification.payload;
  const supabase = createAdminClient();

  // 1. Fetch application details
  const { data: app, error: appErr } = await supabase
    .from("visa_applications")
    .select("id, reference_no, primary_contact_name, product_title")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !app) {
    return new NextResponse(
      renderHtmlMessage("Application Not Found", "The visa application associated with this package could not be found."),
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  // 2. Fetch applicants for naming
  const { data: applicants } = await supabase
    .from("visa_applicants")
    .select("id, full_name, applicant_number")
    .eq("application_id", applicationId);

  const applicantMap = new Map<string, string>();
  (applicants || []).forEach((a) => {
    applicantMap.set(a.id, a.full_name);
  });

  // 3. Fetch documents
  let query = supabase
    .from("visa_application_documents")
    .select("*")
    .eq("application_id", applicationId);

  if (docIds && docIds.length > 0) {
    query = query.in("id", docIds);
  }

  const { data: docs, error: docsErr } = await query.order("created_at", { ascending: true });

  if (docsErr || !docs || docs.length === 0) {
    return new NextResponse(
      renderHtmlMessage("No Documents Available", "No document records were found for this package."),
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  // 4. Download document files and build ZIP entries
  const zipEntries: ZipEntry[] = [];
  const usedFilenames = new Set<string>();

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (!isSafeStoragePath(doc.file_path)) continue;

    const { buffer } = await downloadPrivateDocument(doc.file_path);
    if (!buffer) continue;

    const applicantName =
      (doc.applicant_id ? applicantMap.get(doc.applicant_id) : null) ||
      app.primary_contact_name ||
      `Applicant_${i + 1}`;

    const cleanName = applicantName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanDocType = doc.document_type.replace(/[^a-zA-Z0-9_-]/g, "_");
    const originalExt = doc.file_name.split(".").pop() || "bin";

    let zipFileName = `${cleanName}_${cleanDocType}.${originalExt}`;
    let counter = 1;
    while (usedFilenames.has(zipFileName)) {
      zipFileName = `${cleanName}_${cleanDocType}_${counter}.${originalExt}`;
      counter++;
    }
    usedFilenames.add(zipFileName);

    zipEntries.push({
      filename: zipFileName,
      data: buffer,
    });
  }

  if (zipEntries.length === 0) {
    return new NextResponse(
      renderHtmlMessage("Download Error", "Failed to retrieve documents from secure storage."),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }

  const zipBuffer = createZipArchive(zipEntries);

  // 5. Audit log download
  await logAdminAction({
    adminEmail: "recipient.secure-link@masaarholidays.com",
    adminUserId: null,
    action: "visa.package.secure_link_download",
    resourceType: "visa_application",
    resourceId: app.id,
    details: {
      referenceNo: app.reference_no,
      fileCount: zipEntries.length,
      zipSizeBytes: zipBuffer.length,
      selectedDocCount: docIds ? docIds.length : "all",
    },
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent") || null,
  });

  const zipDownloadName = `${app.reference_no}_documents.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipDownloadName}"`,
      "Content-Length": zipBuffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

function renderHtmlMessage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Masaar Holidays Visa Documents</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf9f6; color: #1c1917; margin: 0; padding: 40px 20px; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
    .card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; }
    .brand { font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #b45309; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 12px 0; color: #1c1917; }
    p { font-size: 14px; line-height: 1.5; color: #78716c; margin: 0 0 24px 0; }
    .contact { font-size: 12px; color: #a8a29e; border-top: 1px solid #f5f5f4; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Masaar Holidays</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="contact">
      Masaar Holidays Visa Operations · care@masaarholidays.com
    </div>
  </div>
</body>
</html>`;
}
