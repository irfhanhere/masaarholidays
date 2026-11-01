import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadPrivateDocument, isSafeStoragePath } from "@/lib/documents/private-storage";
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

  // Validate document belongs to application
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

  const { buffer, contentType, error: downloadErr } = await downloadPrivateDocument(doc.file_path);
  if (downloadErr || !buffer) {
    return NextResponse.json(
      { error: downloadErr || "Failed to retrieve document binary from secure storage." },
      { status: 500 }
    );
  }

  // Audit log document download
  await logAdminAction({
    adminEmail: admin.email,
    adminUserId: admin.id,
    action: "visa.document.download",
    resourceType: "visa_application_document",
    resourceId: doc.id,
    details: {
      applicationId: doc.application_id,
      documentType: doc.document_type,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      filePath: doc.file_path,
    },
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent") || null,
  });

  const safeFilename = encodeURIComponent(doc.file_name.replace(/["\r\n]/g, ""));
  const cleanMime = contentType || doc.mime_type || "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": cleanMime,
      "Content-Disposition": `attachment; filename="${doc.file_name}"; filename*=UTF-8''${safeFilename}`,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
