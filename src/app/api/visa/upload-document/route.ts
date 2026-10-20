import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { uploadPrivateDocument, getPrivateDocumentSignedUrl } from "@/lib/documents/private-storage";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) || "document";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5 MB maximum size limit." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload JPG, PNG or PDF only." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const cleanDocType = documentType.replace(/[^a-zA-Z0-9_-]/g, "");
    const randomId = crypto.randomBytes(8).toString("hex");
    const year = new Date().getFullYear();
    const storagePath = `visa-uploads/${year}/${cleanDocType}_${randomId}.${ext}`;

    const { error: uploadError } = await uploadPrivateDocument(storagePath, buffer, file.type);

    if (uploadError) {
      console.error("[visa-upload] Storage upload failed:", uploadError);
      return NextResponse.json({ error: "Failed to securely store document." }, { status: 500 });
    }

    // Generate a short-lived (10 min) signed URL for preview
    const { signedUrl } = await getPrivateDocumentSignedUrl(storagePath, 600);

    return NextResponse.json({
      success: true,
      filePath: storagePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      previewUrl: signedUrl || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload processing failed";
    console.error("[visa-upload] Internal upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
