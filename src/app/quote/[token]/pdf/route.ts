import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDocumentPdf } from "@/lib/documents/generate-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: share } = await supabase.from("document_shares").select("document_id, expires_at").eq("share_token", token).maybeSingle();
  if (!share || (share.expires_at && new Date(share.expires_at) < new Date())) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  }

  const { data: document } = await supabase.from("documents").select("document_number").eq("id", share.document_id).maybeSingle();
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const pdf = await generateDocumentPdf(share.document_id);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${document.document_number}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[quote/pdf] Puppeteer render failed, falling back to print view:", err?.message);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    return NextResponse.redirect(`${siteUrl}/quote/${token}?print=true`, { status: 302 });
  }
}
