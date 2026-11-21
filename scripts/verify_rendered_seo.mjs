// scripts/verify_rendered_seo.mjs
import { spawn } from "child_process";
import http from "http";

async function testLive() {
  console.log("Starting Next.js production server on port 3031...");
  const server = spawn("npx", ["next", "start", "-p", "3031"], {
    shell: true,
    env: { ...process.env, PORT: "3031" },
  });

  server.stdout.on("data", (d) => console.log("server:", d.toString()));
  server.stderr.on("data", (d) => console.error("server err:", d.toString()));

  // Wait 4 seconds for server to boot
  await new Promise((r) => setTimeout(r, 4500));

  function get(path) {
    return new Promise((resolve, reject) => {
      http
        .get("http://localhost:3031" + path, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
        })
        .on("error", reject);
    });
  }

  try {
    console.log("\n1. Probing /sitemap.xml...");
    const sitemapRes = await get("/sitemap.xml");
    console.log("Status:", sitemapRes.status, "Content-Type:", sitemapRes.headers["content-type"]);
    const hasBSP = sitemapRes.body.includes("https://www.masaarholidays.com/umrah/masaar-best-selling-umrah");
    const hasPrem = sitemapRes.body.includes("https://www.masaarholidays.com/umrah/masaar-premium-umrah");
    const hasAdmin = sitemapRes.body.includes("/admin");
    const hasQA = sitemapRes.body.includes("/qa");
    console.log("Sitemap contains Best Selling URL:", hasBSP);
    console.log("Sitemap contains Premium URL:", hasPrem);
    console.log("Sitemap excludes Admin URLs:", !hasAdmin);
    console.log("Sitemap excludes QA URLs:", !hasQA);

    console.log("\n2. Probing /umrah/masaar-best-selling-umrah...");
    const bspRes = await get("/umrah/masaar-best-selling-umrah");
    console.log("Status:", bspRes.status);
    const hasCanonical = bspRes.body.includes('rel="canonical"') && bspRes.body.includes("https://www.masaarholidays.com/umrah/masaar-best-selling-umrah");
    const hasTouristTrip = bspRes.body.includes('"@type":"TouristTrip"');
    const hasOffers = bspRes.body.includes("Quad Room (Per Person)");
    const hasBreadcrumbs = bspRes.body.includes('"@type":"BreadcrumbList"');
    console.log("Canonical verified:", hasCanonical);
    console.log("TouristTrip schema verified:", hasTouristTrip);
    console.log("Room occupancy offers verified:", hasOffers);
    console.log("BreadcrumbList verified:", hasBreadcrumbs);

    console.log("\n3. Probing /robots.txt...");
    const robotsRes = await get("/robots.txt");
    console.log("Status:", robotsRes.status);
    console.log("Body:\n" + robotsRes.body);

    console.log("\n4. Probing /umrah...");
    const umrahRes = await get("/umrah");
    console.log("Status:", umrahRes.status);
    console.log("Service schema on /umrah verified:", umrahRes.body.includes('"@type":"Service"'));

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    server.kill();
    process.exit(0);
  }
}

testLive();
