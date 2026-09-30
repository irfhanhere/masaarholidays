import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PAGES = [
  { name: 'Homepage (/)', url: 'http://localhost:3000/' },
  { name: 'Umrah (/umrah)', url: 'http://localhost:3000/umrah' },
  { name: 'Hajj (/hajj)', url: 'http://localhost:3000/hajj' },
  { name: 'Hotel (/hotels/conrad-jabal-omar)', url: 'http://localhost:3000/hotels/conrad-jabal-omar' },
];

const resultsDir = path.resolve('scratch/lighthouse');
fs.mkdirSync(resultsDir, { recursive: true });

const summary = [];

for (const page of PAGES) {
  console.log(`Running Mobile Lighthouse on ${page.name}...`);
  const safeName = page.name.replace(/[^a-zA-Z0-9]/g, '_');
  const outPath = path.join(resultsDir, `${safeName}.json`);

  try {
    const cmd = `npx lighthouse ${page.url} --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="${outPath}" --only-categories=performance,seo --form-factor=mobile --quiet`;
    execSync(cmd, { stdio: 'inherit', env: { ...process.env, CHROME_PATH: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' } });

    const raw = fs.readFileSync(outPath, 'utf-8');
    const data = JSON.parse(raw);

    const perfScore = Math.round((data.categories.performance?.score || 0) * 100);
    const seoScore = Math.round((data.categories.seo?.score || 0) * 100);
    const lcp = data.audits['largest-contentful-paint']?.displayValue || 'N/A';
    const fcp = data.audits['first-contentful-paint']?.displayValue || 'N/A';
    const tbt = data.audits['total-blocking-time']?.displayValue || 'N/A';
    const cls = data.audits['cumulative-layout-shift']?.displayValue || 'N/A';

    console.log(`  Performance: ${perfScore} | SEO: ${seoScore} | LCP: ${lcp} | TBT: ${tbt} | CLS: ${cls}\n`);
    summary.push({
      page: page.name,
      perfScore,
      seoScore,
      lcp,
      fcp,
      tbt,
      cls,
    });
  } catch (err) {
    console.error(`Error running lighthouse on ${page.name}:`, err.message);
  }
}

console.log('================ LIGHTHOUSE RESULTS SUMMARY ================');
console.table(summary);
fs.writeFileSync(path.join(resultsDir, 'summary.json'), JSON.stringify(summary, null, 2));
