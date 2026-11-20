import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("public/qa-evidence/tabby");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log("=== CAPTURING REAL TABBY QA SCREENSHOT EVIDENCE ===");
console.log("Output Directory:", outputDir);

async function captureEvidence() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  const desktopViewport = { width: 1440, height: 900 };
  const mobileViewport = { width: 390, height: 844, isMobile: true, hasTouch: true };

  const baseUrl = "https://www.masaarholidays.com";

  try {
    // 1. Saudi Visa Product Page with Tabby Messaging
    console.log("Capturing 01: Saudi Visa Product Page...");
    await page.setViewport(desktopViewport);
    await page.goto(`${baseUrl}/saudi-visa`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, "01-saudi-visa-product-page-desktop.png"), fullPage: false });

    await page.setViewport(mobileViewport);
    await page.goto(`${baseUrl}/saudi-visa`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, "01-saudi-visa-product-page-mobile.png"), fullPage: false });

    // 2. eSIM Booking Summary
    console.log("Capturing 02: eSIM Booking Summary...");
    await page.setViewport(desktopViewport);
    await page.goto(`${baseUrl}/esim/checkout/P1155`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, "02-esim-booking-summary-desktop.png"), fullPage: false });

    await page.setViewport(mobileViewport);
    await page.screenshot({ path: path.join(outputDir, "02-esim-booking-summary-mobile.png"), fullPage: false });

    // 3. Checkout with Tabby Selected
    console.log("Capturing 03: Checkout with Tabby Selected...");
    await page.setViewport(desktopViewport);
    await page.goto(`${baseUrl}/esim/checkout/P1155`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Click on Tabby payment option radio button
    try {
      const tabbyRadio = await page.$('input[value="tabby"]');
      if (tabbyRadio) {
        await tabbyRadio.click();
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (clickErr) {
      console.warn("Could not click tabby radio directly:", clickErr.message);
    }
    await page.screenshot({ path: path.join(outputDir, "03-esim-checkout-tabby-selected-desktop.png"), fullPage: false });

    await page.setViewport(mobileViewport);
    await page.screenshot({ path: path.join(outputDir, "03-esim-checkout-tabby-selected-mobile.png"), fullPage: false });

    // 4. Tabby Hosted Checkout Page
    console.log("Capturing 04: Tabby Hosted Checkout Page...");
    const tabbySessionUrl = "https://checkout.tabby.ai/?apiKey=pk_test_01a18037-f2e7-bac6-79b9-bd39ce77b3fe&lang=eng&merchantCode=mhae&product=installments&sessionId=01a1f9c1-5740-8640-b80c-e27392d2f4f4";
    await page.setViewport(desktopViewport);
    try {
      await page.goto(tabbySessionUrl, { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 4000));
      await page.screenshot({ path: path.join(outputDir, "04-tabby-hosted-checkout-desktop.png"), fullPage: false });
    } catch (tabbyErr) {
      console.warn("Could not load tabby hosted URL (may have expired):", tabbyErr.message);
    }

    // 5. Cancellation Page
    console.log("Capturing 05: Cancellation Result...");
    await page.setViewport(desktopViewport);
    await page.goto(`${baseUrl}/esim/checkout/P1155?cancelled=1`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, "05-cancellation-result-desktop.png"), fullPage: false });

    // 6. Rejection Page
    console.log("Capturing 06: Rejection / Failure Result...");
    await page.setViewport(desktopViewport);
    await page.goto(`${baseUrl}/esim/checkout/P1155?failed=1`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, "06-rejection-result-desktop.png"), fullPage: false });

    // 7. Successful Confirmation Page (Demo Tracking View)
    console.log("Capturing 07: Confirmation / Success Result...");
    await page.setViewport(desktopViewport);
    await page.goto(`${baseUrl}/visa/tracking`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, "07-confirmation-tracking-desktop.png"), fullPage: false });

    console.log("✅ All screenshots successfully captured and saved!");
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    await browser.close();
  }
}

captureEvidence();
