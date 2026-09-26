import "server-only";
import puppeteer from "puppeteer";
import { signDocumentRenderToken } from "@/lib/documents/render-token";

/**
 * The origin Puppeteer itself navigates to — deliberately NOT
 * lib/site-url.ts#getSiteOrigin(). That helper intentionally points at the
 * real public domain even in local dev (see its own header comment, fixing
 * a past incident where canonical/sitemap URLs leaked "localhost"), which
 * is correct for SEO/canonical URLs but wrong here: it would make a local
 * dev server's PDF generation navigate out to the live production site
 * instead of rendering its own /doc-render page, silently PDF-ing whatever
 * 404 page it finds there. Puppeteer must always reach the app instance
 * that is actually running this code.
 */
function getCandidateOrigins(): string[] {
  const port = process.env.PORT ?? 3000;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://masaarholidays.com").replace(/\/$/, "");
  
  const origins: string[] = [];
  if (process.env.INTERNAL_URL) {
    origins.push(process.env.INTERNAL_URL.replace(/\/$/, ""));
  }
  // 127.0.0.1 avoids loopback DNS / Cloudflare WAF block on self-hosted environments
  origins.push(`http://127.0.0.1:${port}`);
  origins.push(`http://localhost:${port}`);
  if (!origins.includes(siteUrl)) {
    origins.push(siteUrl);
  }
  return origins;
}

/**
 * Renders a document to a branded A4 PDF by having a real headless
 * Chromium tab load its own /doc-render/[id] page and print it — so the
 * PDF is pixel-identical to the live preview and the public quote page
 * (all three render the exact same QuotationDocumentView), rather than a
 * second hand-built PDF layout that has to be kept in sync by hand.
 */
export async function generateDocumentPdf(documentId: string): Promise<Buffer> {
  const token = signDocumentRenderToken(documentId);
  const path = `/doc-render/${documentId}?key=${token}`;
  const candidateOrigins = getCandidateOrigins();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote",
    ],
  });

  try {
    const page = await browser.newPage();
    let loaded = false;
    let lastError: any = null;

    for (const origin of candidateOrigins) {
      try {
        const targetUrl = `${origin}${path}`;
        const response = await page.goto(targetUrl, {
          waitUntil: "networkidle0",
          timeout: 15000,
        });
        if (response && response.ok()) {
          loaded = true;
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!loaded) {
      throw new Error(`Could not render document ${documentId} for PDF (${lastError?.message || "Failed to reach internal render server"}).`);
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
