// Takes a screenshot of the Lumen dashboard with sample-data.csv loaded.
// Usage: node scripts/screenshot.mjs
import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SAMPLE_FILE = resolve(ROOT, 'sample-data.csv');
const OUTPUT = resolve(ROOT, 'public', 'screenshot.png');

const URL = 'http://localhost:5173';

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport to a typical desktop size
  await page.setViewport({ width: 1440, height: 900 });

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle2' });

  // Wait for the dropzone to appear
  await page.waitForSelector('.dropzone', { timeout: 10000 });
  console.log('Dropzone found.');

  // Upload the sample-data.csv via the hidden file input
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    console.error('File input not found!');
    await browser.close();
    process.exit(1);
  }

  await fileInput.uploadFile(SAMPLE_FILE);
  console.log('sample-data.csv uploaded.');

  // Wait for charts to render (look for canvas elements or the charts panel)
  try {
    await page.waitForSelector('.charts-panel, canvas', { timeout: 15000 });
  } catch {
    // If charts panel doesn't appear, wait a bit and check for stat cards
    await page.waitForSelector('.stats-cards, .data-preview', { timeout: 10000 });
  }

  // Extra wait for chart.js animations to settle
  await new Promise((r) => setTimeout(r, 3000));

  console.log(`Taking screenshot → ${OUTPUT}`);
  await page.screenshot({
    path: OUTPUT,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });

  console.log('Done.');
  await browser.close();
}

main().catch((err) => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
