import { NextResponse } from "next/server";
import { generateDocumentPdf } from "@/lib/documents/generate-pdf";
import { getDocument } from "@/lib/data/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document || document.document_type !== "receipt") {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const pdf = await generateDocumentPdf(id);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.document_number}.pdf"`,
    },
  });
}
