import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadPrivateDocument, isSafeStoragePath } from "@/lib/documents/private-storage";
import { createZipArchive, type ZipEntry } from "@/lib/documents/simple-zip";
import { logAdminAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

async function verifyAdminAuth() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return { id: user.id, email: user.email || "staff@masaarholidays.com" };
    }
  } catch {
    // ignore
  }

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return { id: "dev-admin", email: "admin@masaarholidays.com" };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin login required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get("applicationId")?.trim();

  if (!applicationId) {
    return NextResponse.json({ error: "Missing applicationId parameter." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Fetch application details
  const { data: app, error: appErr } = await supabase
    .from("visa_applications")
    .select("id, reference_no, primary_contact_name")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  // 2. Fetch all applicants for naming
  const { data: applicants } = await supabase
    .from("visa_applicants")
    .select("id, full_name, applicant_number")
    .eq("application_id", applicationId);

  const applicantMap = new Map<string, string>();
  (applicants || []).forEach((a) => {
    applicantMap.set(a.id, a.full_name);
  });

  // 3. Fetch all uploaded documents
  const { data: docs, error: docsErr } = await supabase
    .from("visa_application_documents")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (docsErr || !docs || docs.length === 0) {
    return NextResponse.json(
      { error: "No uploaded documents found for this application." },
      { status: 404 }
    );
  }

  // 4. Download each document from secure storage and build ZIP entries
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
    return NextResponse.json(
      { error: "Failed to read document files from storage for ZIP archive." },
      { status: 500 }
    );
  }

  // 5. Generate ZIP Archive
  const zipBuffer = createZipArchive(zipEntries);

  // 6. Log admin audit action
  await logAdminAction({
    adminEmail: admin.email,
    adminUserId: admin.id,
    action: "visa.documents.download_all_zip",
    resourceType: "visa_application",
    resourceId: app.id,
    details: {
      referenceNo: app.reference_no,
      fileCount: zipEntries.length,
      zipSizeBytes: zipBuffer.length,
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
