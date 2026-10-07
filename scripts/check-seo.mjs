import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const PUBLIC_DIR = path.resolve('public');

async function fetchSitemap() {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const locRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

function parseHtml(html) {
  // Extract Title
  const titleMatches = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)];
  const titles = titleMatches.map(m => m[1].trim());

  // Extract Meta Descriptions
  const metaDescMatches = [...html.matchAll(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["'][^>]*>/gi)]
    .concat([...html.matchAll(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["'][^>]*>/gi)]);
  const descriptions = metaDescMatches.map(m => m[1].trim());

  // Extract H1 tags
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1s = h1Matches.map(m => m[1].replace(/<[^>]+>/g, '').trim());

  // Extract Canonical
  const canonicalMatches = [...html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["'][^>]*>/gi)]
    .concat([...html.matchAll(/<link\s+href=["']([\s\S]*?)["']\s+rel=["']canonical["'][^>]*>/gi)]);
  const canonicals = canonicalMatches.map(m => m[1].trim());

  // Extract Robots
  const robotsMatches = [...html.matchAll(/<meta\s+name=["']robots["']\s+content=["']([\s\S]*?)["'][^>]*>/gi)];
  const robots = robotsMatches.map(m => m[1].trim());

  // Extract Hreflang
  const hreflangMatches = [...html.matchAll(/<link\s+[^>]*rel=["']alternate["'][^>]*>/gi)];
  const hreflangs = [];
  for (const tag of hreflangMatches) {
    const raw = tag[0];
    const langMatch = raw.match(/hreflang=["']([^"']+)["']/i);
    const hrefMatch = raw.match(/href=["']([^"']+)["']/i);
    if (langMatch && hrefMatch) {
      hreflangs.push({ lang: langMatch[1], href: hrefMatch[1] });
    }
  }

  // Extract Image sources
  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  const imgSrcs = imgMatches.map(m => m[1].trim());

  // Extract CSS urls
  const cssUrlMatches = [...html.matchAll(/url\(['"]?([^'"\)\s]+)['"]?\)/gi)];
  const cssUrls = cssUrlMatches.map(m => m[1].trim());

  return {
    titles,
    descriptions,
    h1s,
    canonicals,
    robots,
    hreflangs,
    imgSrcs,
    cssUrls,
  };
}

function checkLocalAssetExists(assetPath) {
  if (!assetPath.startsWith('/')) return true; // Relative or external
  if (assetPath.startsWith('/_next/')) return true; // Next internal bundle/image loader
  
  // Clean URL params if any
  const cleanPath = assetPath.split('?')[0].split('#')[0];
  const decodedPath = decodeURIComponent(cleanPath);
  const fullPath = path.join(PUBLIC_DIR, decodedPath);
  return fs.existsSync(fullPath);
}

function auditImageFileSizes() {
  console.log('\n--- SCANNING SERVED IMAGES FOR BUDGET (<200KB) ---');
  const targetDirs = [
    path.join(PUBLIC_DIR, 'brand'),
    path.join(PUBLIC_DIR, 'trips'),
    path.join(PUBLIC_DIR, 'hotels'),
    path.join(PUBLIC_DIR, 'vehicles'),
  ];

  let totalImagesScanned = 0;
  let overBudgetCount = 0;
  const overBudgetList = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(webp|jpg|jpeg|png|avif)$/i.test(entry.name)) {
        totalImagesScanned++;
        const stat = fs.statSync(fullPath);
        const kb = stat.size / 1024;
        if (kb > 200) {
          overBudgetCount++;
          const rel = path.relative(PUBLIC_DIR, fullPath);
          overBudgetList.push({ path: rel, sizeKb: kb.toFixed(1) });
        }
      }
    }
  }

  for (const d of targetDirs) {
    scanDir(d);
  }

  console.log(`Scanned ${totalImagesScanned} served image files across brand, trips, hotels, vehicles.`);
  if (overBudgetCount === 0) {
    console.log(`[PASS] 100% of served image assets are under the 200 KB budget!\n`);
  } else {
    console.error(`[FAIL] Found ${overBudgetCount} images exceeding 200 KB budget:`);
    overBudgetList.forEach(img => console.error(`  - ${img.path}: ${img.sizeKb} KB`));
  }

  return overBudgetCount === 0;
}

async function runAudit() {
  console.log('======================================================');
  console.log('         MASAAR HOLIDAYS SEO & INTEGRITY AUDIT        ');
  console.log('======================================================\n');
  console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
  const urls = await fetchSitemap();
  console.log(`Discovered ${urls.length} URLs in sitemap.xml.\n`);

  let failures = 0;
  let passed = 0;
  const missingAssets = new Set();
  const report = [];

  for (const rawUrl of urls) {
    const urlObj = new URL(rawUrl);
    const localUrl = `${BASE_URL}${urlObj.pathname}`;
    const urlIssues = [];

    // 1. Check placeholder / query string in sitemap loc
    if (urlObj.search) {
      urlIssues.push(`Sitemap URL contains query string: ${urlObj.search}`);
    }
    if (rawUrl.includes('placeholder')) {
      urlIssues.push(`Sitemap URL contains 'placeholder': ${rawUrl}`);
    }

    try {
      const res = await fetch(localUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
      });

      if (res.status !== 200) {
        urlIssues.push(`Expected HTTP 200, got ${res.status}`);
      }

      const html = await res.text();
      const parsed = parseHtml(html);

      // 2. Check Title
      if (parsed.titles.length === 0) {
        urlIssues.push('Missing <title> tag');
      } else if (parsed.titles.length > 1) {
        urlIssues.push(`Multiple <title> tags (${parsed.titles.length})`);
      } else if (parsed.titles[0].length === 0) {
        urlIssues.push('Empty <title> tag');
      } else if (parsed.titles[0].length > 60) {
        urlIssues.push(`Title exceeds 60 characters (${parsed.titles[0].length}): "${parsed.titles[0]}"`);
      }

      // 3. Check Description
      if (parsed.descriptions.length === 0) {
        urlIssues.push('Missing meta description');
      } else if (parsed.descriptions.length > 1) {
        urlIssues.push(`Multiple meta descriptions (${parsed.descriptions.length})`);
      } else if (parsed.descriptions[0].length === 0) {
        urlIssues.push('Empty meta description');
      }

      // 4. Check H1
      if (parsed.h1s.length === 0) {
        urlIssues.push('Missing <h1> tag');
      } else if (parsed.h1s.length > 1) {
        urlIssues.push(`Multiple <h1> tags (${parsed.h1s.length}): ${parsed.h1s.map(h => `"${h.slice(0, 30)}..."`).join(', ')}`);
      }

      // 5. Check Canonical (Self-canonical required)
      if (parsed.canonicals.length === 0) {
        urlIssues.push('Missing canonical <link>');
      } else if (parsed.canonicals.length > 1) {
        urlIssues.push(`Multiple canonical tags (${parsed.canonicals.length})`);
      } else {
        const canonical = parsed.canonicals[0];
        const expectedCanonical = `https://www.masaarholidays.com${urlObj.pathname === '/' ? '' : urlObj.pathname}`;
        const normalizedCanonical = canonical.replace(/\/$/, '');
        const normalizedExpected = expectedCanonical.replace(/\/$/, '');
        if (normalizedCanonical !== normalizedExpected) {
          urlIssues.push(`Canonical mismatch: got "${canonical}", expected "${expectedCanonical}"`);
        }
      }

      // 6. Check Robots (No noindex on sitemap URLs)
      for (const robot of parsed.robots) {
        if (robot.toLowerCase().includes('noindex')) {
          urlIssues.push(`Found 'noindex' in robots meta: "${robot}"`);
        }
      }

      // 7. Check Hreflang (Supported locales: en-AE, ar-AE, ur-AE, hi-AE, x-default)
      const nonEnabledHreflangs = parsed.hreflangs.filter(h => !['en', 'en-ae', 'ar', 'ar-ae', 'ur', 'ur-ae', 'hi', 'hi-ae', 'x-default'].includes(h.lang.toLowerCase()));
      if (nonEnabledHreflangs.length > 0) {
        urlIssues.push(`Found non-enabled hreflang: ${nonEnabledHreflangs.map(h => h.lang).join(', ')}`);
      }

      // 8. Check local image links
      for (const src of parsed.imgSrcs) {
        if (src.startsWith('/') && !checkLocalAssetExists(src)) {
          if (src.startsWith('/_next/image')) {
            const parsedImgUrl = new URL(src, BASE_URL);
            const underlyingUrl = parsedImgUrl.searchParams.get('url');
            if (underlyingUrl && underlyingUrl.startsWith('/') && !checkLocalAssetExists(underlyingUrl)) {
              urlIssues.push(`Missing image asset: ${underlyingUrl}`);
              missingAssets.add(underlyingUrl);
            }
          } else {
            urlIssues.push(`Missing image asset: ${src}`);
            missingAssets.add(src);
          }
        }
      }

      // 9. Check CSS url assets
      for (const cssUrl of parsed.cssUrls) {
        if (cssUrl.startsWith('/') && !checkLocalAssetExists(cssUrl)) {
          urlIssues.push(`Missing CSS referenced asset: ${cssUrl}`);
          missingAssets.add(cssUrl);
        }
      }

      if (urlIssues.length > 0) {
        failures++;
        console.error(`[FAIL] ${rawUrl}`);
        urlIssues.forEach(iss => console.error(`  - ${iss}`));
        report.push({ url: rawUrl, status: 'FAIL', issues: urlIssues });
      } else {
        passed++;
        console.log(`[PASS] ${rawUrl}`);
        console.log(`       Title (${parsed.titles[0].length}c): "${parsed.titles[0]}"`);
        console.log(`       H1: "${parsed.h1s[0]?.slice(0, 45)}..."`);
        report.push({ url: rawUrl, status: 'PASS', title: parsed.titles[0], h1: parsed.h1s[0] });
      }
    } catch (err) {
      failures++;
      console.error(`[ERROR] Fetching ${localUrl}:`, err.message);
      report.push({ url: rawUrl, status: 'ERROR', error: err.message });
    }
  }

  const imageBudgetPassed = auditImageFileSizes();

  console.log('\n=======================================');
  console.log(`AUDIT SUMMARY: ${passed} PASSED, ${failures} FAILED out of ${urls.length} URLs.`);
  console.log(`IMAGE BUDGET AUDIT: ${imageBudgetPassed ? 'PASSED (0 images > 200KB)' : 'FAILED'}`);
  if (missingAssets.size > 0) {
    console.log(`\nMISSING LOCAL ASSETS (${missingAssets.size}):`);
    missingAssets.forEach(a => console.log(`  - ${a}`));
  }
  console.log('=======================================\n');

  if (failures > 0 || !imageBudgetPassed) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
