import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

// Parse .env.local
try {
  const envConfig = fs.readFileSync(".env.local", "utf8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
} catch {}

const ARTIFACT_DIR = "C:/Users/heads/.gemini/antigravity/brain/2c96008b-6dce-4add-bbf9-01caeb67ee72";
const PORT = 3033;
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

async function capture() {
  console.log("Starting Next.js dev server on port " + PORT + "...");

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
    console.log("Waiting for server...");
    for (let i = 0; i < 40; i++) {
      await wait(1500);
      if (await isPortReady(PORT)) break;
    }

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1100 });

    await page.setCookie({
      name: "dev_admin_bypass",
      value: "true",
      domain: "localhost",
    });

    const editUrl = `${BASE_URL}/admin/umrah-packages/1aa5d09c-0779-4c09-a677-51bfa3f5dd32?dev_bypass=true`;
    console.log("Navigating to:", editUrl);
    await page.goto(editUrl, { waitUntil: "networkidle0", timeout: 30000 });
    await wait(2000);

    // Click on the SEO tab
    console.log("Clicking on SEO tab...");
    const tabs = await page.$$("button");
    for (const tab of tabs) {
      const text = await page.evaluate((el) => el.innerText, tab);
      if (text && text.includes("H. SEO & Sharing")) {
        await tab.click();
        break;
      }
    }

    await wait(1500);
    const outPath = path.join(ARTIFACT_DIR, "screenshot_admin_umrah_package_seo_tab.png");
    await page.screenshot({ path: outPath, fullPage: false });
    console.log("✓ Saved SEO tab screenshot to:", outPath);

    await browser.close();
  } catch (err) {
    console.error("Capture error:", err);
  } finally {
    devServer.kill();
  }
}

capture();
