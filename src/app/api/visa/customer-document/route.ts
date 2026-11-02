import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrivateDocumentSignedUrl, isSafeStoragePath } from "@/lib/documents/private-storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  const documentId = searchParams.get("documentId")?.trim();

  if (!token || !documentId) {
    return NextResponse.json(
      { error: "Missing tracking token or document ID." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 1. Verify tracking token ownership
  const { data: application, error: appErr } = await supabase
    .from("visa_applications")
    .select("id, reference_no, tracking_token, primary_contact_email")
    .eq("tracking_token", token)
    .maybeSingle();

  if (appErr || !application) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid application tracking token." },
      { status: 403 }
    );
  }

  // 2. Verify document belongs to this specific application
  const { data: doc, error: docErr } = await supabase
    .from("visa_application_documents")
    .select("*")
    .eq("id", documentId)
    .eq("application_id", application.id)
    .maybeSingle();

  if (docErr || !doc) {
    return NextResponse.json(
      { error: "Document not found or does not belong to this application." },
      { status: 404 }
    );
  }

  if (!isSafeStoragePath(doc.file_path)) {
    return NextResponse.json({ error: "Invalid document path." }, { status: 400 });
  }

  // 3. Generate short-lived (10 minutes) signed URL
  const { signedUrl, error: signErr } = await getPrivateDocumentSignedUrl(doc.file_path, 600);
  if (signErr || !signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate secure document access link." },
      { status: 500 }
    );
  }

  // 4. Audit log customer document access
  const { logAdminAction } = await import("@/lib/audit-logger");
  await logAdminAction({
    adminEmail: `customer:${application.primary_contact_email || "client"}`,
    adminUserId: null,
    action: "visa.customer.document.download",
    resourceType: "visa_application_document",
    resourceId: doc.id,
    details: {
      applicationId: application.id,
      referenceNo: application.reference_no,
      documentType: doc.document_type,
      fileName: doc.file_name,
    },
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent") || null,
  });

  return NextResponse.json({
    success: true,
    url: signedUrl,
    fileName: doc.file_name,
    mimeType: doc.mime_type,
    documentType: doc.document_type,
  });
}
