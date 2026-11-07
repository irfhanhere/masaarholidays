import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "media";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const documentId = formData.get("documentId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Please choose a flight screenshot to upload." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Only PNG, JPG, JPEG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image size must be 10 MB or less." },
        { status: 400 }
      );
    }

    const docId = typeof documentId === "string" && documentId.trim() ? documentId.trim() : "general";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `quotations/${docId}/flights/${Date.now()}_${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[flight-attachment] Upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message || "Failed to upload image." },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath: path,
    });
  } catch (err: any) {
    console.error("[flight-attachment] Handler error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { storagePath, url } = await req.json();
    let targetPath = storagePath;

    if (!targetPath && url) {
      const match = url.match(/\/object\/public\/media\/(.+)$/);
      if (match) {
        targetPath = decodeURIComponent(match[1]);
      }
    }

    if (!targetPath) {
      return NextResponse.json(
        { success: false, error: "Missing storage path or url" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).remove([targetPath]);
    if (error) {
      console.warn("[flight-attachment] Remove warning:", error);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[flight-attachment] DELETE error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

