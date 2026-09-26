import { NextResponse } from "next/server";
import { generateDocumentPdf } from "@/lib/documents/generate-pdf";
import { getDocument } from "@/lib/data/documents";
import { signDocumentRenderToken } from "@/lib/documents/render-token";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const token = signDocumentRenderToken(id);

  try {
    const pdf = await generateDocumentPdf(id);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${document.document_number}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[booking-voucher/pdf] Puppeteer failed on host, falling back to print render:", err?.message);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    return NextResponse.redirect(`${siteUrl}/doc-render/${id}?key=${token}&print=true`, { status: 302 });
  }
}
