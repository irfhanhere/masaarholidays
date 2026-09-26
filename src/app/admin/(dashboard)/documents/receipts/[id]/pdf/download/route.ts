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
  const downloadUrl = `${origin}/doc-render/${id}?key=${token}&download=true`;

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Masaar Holidays - Downloading Receipt PDF</title>
  <meta http-equiv="refresh" content="0;url=${downloadUrl}">
  <script>window.location.replace(${JSON.stringify(downloadUrl)});</script>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:60px 20px;background:#FAF8F5;color:#1A1816;">
  <p style="font-size:16px;font-weight:600;">Generating and preparing your PDF file...</p>
  <p style="font-size:13px;color:#777;">If the download does not start automatically, <a href="${downloadUrl}" style="color:#B37E28;font-weight:bold;">click here to download PDF</a>.</p>
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
