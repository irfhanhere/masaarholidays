import { NextResponse } from "next/server";
import { generateDocumentPdf } from "@/lib/documents/generate-pdf";
import { getDocument } from "@/lib/data/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document || document.document_type !== "receipt") {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  try {
    const pdf = await generateDocumentPdf(id);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${document.document_number}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[receipt/pdf] PDF generation failed:", err?.message);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    return NextResponse.redirect(`${siteUrl}/admin/documents/receipts/${id}/pdf`, { status: 302 });
  }
}
