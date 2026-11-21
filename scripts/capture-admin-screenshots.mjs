import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const ARTIFACT_DIR = "C:/Users/heads/.gemini/antigravity/brain/2c96008b-6dce-4add-bbf9-01caeb67ee72";
const PORT = 3030;
const BASE_URL = `http://localhost:${PORT}`;

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isPortReady(port) {
  try {
    const res = await fetch(`http://localhost:${port}/api/tabby/config`);
    return res.status === 200 || res.status === 404;
  } catch {
    return false;
  }
}

async function captureScreenshots() {
  console.log("Starting Next.js dev server on port " + PORT + " with auth bypass enabled...");

  const env = {
    ...process.env,
    NODE_ENV: "development",
    ALLOW_DEV_AUTH_BYPASS: "true",
    PORT: String(PORT),
  };

  const devServer = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env,
    shell: true,
    stdio: "inherit",
  });

  try {
    console.log("Waiting for server to be responsive...");
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await wait(1500);
      if (await isPortReady(PORT)) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      console.warn("Dev server not responding in time, attempting browser connection anyway...");
    } else {
      console.log("Server is ready!");
    }

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 950 });

    // Set dev bypass cookie
    await page.setCookie({
      name: "dev_admin_bypass",
      value: "true",
      domain: "localhost",
    });

    const pagesToCapture = [
      {
        url: `${BASE_URL}/admin/umrah-packages?dev_bypass=true`,
        filename: "screenshot_admin_umrah_packages_list.png",
        title: "Umrah Packages Listing",
      },
      {
        url: `${BASE_URL}/admin/umrah-packages/1aa5d09c-0779-4c09-a677-51bfa3f5dd32?dev_bypass=true`,
        filename: "screenshot_admin_best_selling_package_edit.png",
        title: "Best Selling Package Opened in Admin",
      },
      {
        url: `${BASE_URL}/admin/umrah-packages/new?dev_bypass=true`,
        filename: "screenshot_admin_new_package_form.png",
        title: "Add New Umrah Package Form",
      },
      {
        url: `${BASE_URL}/admin/homepage?dev_bypass=true`,
        filename: "screenshot_admin_homepage_cms.png",
        title: "Homepage Content Management",
      },
      {
        url: `${BASE_URL}/admin/payment-display?dev_bypass=true`,
        filename: "screenshot_admin_payment_display_settings.png",
        title: "Payment Display Settings",
      },
    ];

    for (const item of pagesToCapture) {
      console.log(`Navigating to ${item.title} (${item.url})...`);
      try {
        await page.goto(item.url, { waitUntil: "networkidle0", timeout: 25000 });
        await wait(1000);
        const outPath = path.join(ARTIFACT_DIR, item.filename);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`✓ Saved ${item.title} to: ${outPath}`);
      } catch (e) {
        console.error(`Error capturing ${item.title}:`, e.message);
      }
    }

    await browser.close();
    console.log("Screenshots captured successfully.");
  } finally {
    console.log("Stopping dev server...");
    devServer.kill();
  }
}

captureScreenshots();
