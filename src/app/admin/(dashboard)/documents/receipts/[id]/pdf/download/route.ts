import { NextResponse } from "next/server";
import { signDocumentRenderToken } from "@/lib/documents/render-token";

function getOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host");
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  return "https://masaarholidays.com";
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = signDocumentRenderToken(id);
  const origin = getOrigin(req);
  const printUrl = `${origin}/doc-render/${id}?key=${token}&print=true`;

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Masaar Holidays - Receipt PDF</title>
  <meta http-equiv="refresh" content="0;url=${printUrl}">
  <script>window.location.replace(${JSON.stringify(printUrl)});</script>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:60px 20px;background:#FAF8F5;color:#1A1816;">
  <p style="font-size:16px;font-weight:600;">Generating and preparing your PDF...</p>
  <p style="font-size:13px;color:#777;">If the document does not open automatically, <a href="${printUrl}" style="color:#B37E28;font-weight:bold;">click here to print / save as PDF</a>.</p>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
