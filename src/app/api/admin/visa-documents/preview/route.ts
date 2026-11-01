import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrivateDocumentSignedUrl, isSafeStoragePath } from "@/lib/documents/private-storage";
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
  const documentId = searchParams.get("documentId")?.trim();
  const applicationId = searchParams.get("applicationId")?.trim();

  if (!documentId || !applicationId) {
    return NextResponse.json(
      { error: "Missing documentId or applicationId parameter." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: doc, error: docErr } = await supabase
    .from("visa_application_documents")
    .select("*, visa_applications(reference_no)")
    .eq("id", documentId)
    .eq("application_id", applicationId)
    .maybeSingle();

  if (docErr || !doc) {
    return NextResponse.json(
      { error: "Document not found or does not belong to specified application." },
      { status: 404 }
    );
  }

  if (!isSafeStoragePath(doc.file_path)) {
    return NextResponse.json({ error: "Unsafe document file path detected." }, { status: 400 });
  }

  // Generate 15-minute temporary signed URL
  const { signedUrl, error: signErr } = await getPrivateDocumentSignedUrl(doc.file_path, 900);
  if (signErr || !signedUrl) {
    return NextResponse.json(
      { error: signErr || "Failed to generate secure preview URL." },
      { status: 500 }
    );
  }

  // Audit log document preview
  await logAdminAction({
    adminEmail: admin.email,
    adminUserId: admin.id,
    action: "visa.document.preview",
    resourceType: "visa_application_document",
    resourceId: doc.id,
    details: {
      applicationId: doc.application_id,
      documentType: doc.document_type,
      fileName: doc.file_name,
      filePath: doc.file_path,
    },
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent") || null,
  });

  return NextResponse.json({
    success: true,
    previewUrl: signedUrl,
    fileName: doc.file_name,
    mimeType: doc.mime_type,
    documentType: doc.document_type,
    fileSize: doc.file_size,
    expiresInSeconds: 900,
  });
}
