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
function getInternalRenderOrigin(): string {
  if (process.env.NODE_ENV !== "production") {
    return `http://localhost:${process.env.PORT ?? 3000}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://masaarholidays.com").replace(/\/$/, "");
}

/**
 * Renders a document to a branded A4 PDF by having a real headless
 * Chromium tab load its own /doc-render/[id] page and print it — so the
 * PDF is pixel-identical to the live preview and the public quote page
 * (all three render the exact same QuotationDocumentView), rather than a
 * second hand-built PDF layout that has to be kept in sync by hand.
 */
export async function generateDocumentPdf(documentId: string): Promise<Buffer> {
  const url = `${getInternalRenderOrigin()}/doc-render/${documentId}?key=${signDocumentRenderToken(documentId)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: "networkidle0" });
    if (!response || !response.ok()) {
      throw new Error(`Could not render document ${documentId} for PDF (${url} returned ${response?.status() ?? "no response"}).`);
    }
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
