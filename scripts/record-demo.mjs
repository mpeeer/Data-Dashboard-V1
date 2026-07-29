// Records a demo video showcasing all Lumen dashboard features.
// Usage: node scripts/record-demo.mjs
// Output: public/demo.mp4

import puppeteer from 'puppeteer';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { execFile } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, rmSync, writeFileSync, copyFileSync } from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SAMPLE_FILE = resolve(ROOT, 'sample-data.csv');
const FRAMES_DIR = resolve(ROOT, '.demo-frames');
const OUTPUT_PUBLIC = resolve(ROOT, 'public', 'demo.mp4');
const OUTPUT_ROOT = resolve(ROOT, 'demo.mp4');
const URL = 'http://localhost:5173';

const FPS = 2;   // frames per second — smooth enough for a dashboard demo
const WIDTH = 1440;
const HEIGHT = 900;

// ── helpers ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let frameIdx = 0;
async function capture(page, frames = 1) {
  for (let i = 0; i < frames; i++) {
    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    const pad = String(frameIdx++).padStart(6, '0');
    writeFileSync(resolve(FRAMES_DIR, `frame-${pad}.png`), buf);
    if (frames > 1 && i < frames - 1) await sleep(50);
  }
}

async function clickText(page, text) {
  const el = await page.evaluateHandle((t) => {
    // Find element whose visible text content matches exactly
    const all = document.querySelectorAll('button, label, span, a');
    for (const e of all) {
      if (e.textContent?.trim() === t) return e;
    }
    return null;
  }, text);
  if (el.asElement()) {
    await el.asElement().click();
  }
  await el.dispose();
}

// ── main ────────────────────────────────────────────────────────────

async function main() {
  // Prepare frames directory
  rmSync(FRAMES_DIR, { recursive: true, force: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  // ── Scene 1: Empty state (2s) ─────────────────────────────────────
  console.log('Scene 1: Empty state');
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.dropzone', { timeout: 10000 });
  await sleep(500);
  await capture(page, 4);

  // ── Scene 2: Upload sample data (3s) ──────────────────────────────
  console.log('Scene 2: Uploading sample-data.csv');
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(SAMPLE_FILE);
  await sleep(500);

  // Wait for dashboard to render
  try {
    await page.waitForSelector('canvas', { timeout: 15000 });
  } catch {
    await page.waitForSelector('.stat-card', { timeout: 10000 });
  }
  await sleep(2500); // let charts animate in
  await capture(page, 6);

  // ── Scene 3: Hover over charts + expand button visible (2s) ──────
  console.log('Scene 3: Hover chart card');
  const chartCard = await page.$('.chart-card');
  if (chartCard) {
    await chartCard.hover();
    await sleep(400);
    await capture(page, 1);
    // Click expand for fullscreen
    const expandBtn = await page.$('.chart-expand-btn');
    if (expandBtn) {
      await expandBtn.click();
      await sleep(800);
      console.log('  Fullscreen chart open');
      await capture(page, 4);
      // Close fullscreen
      await page.keyboard.press('Escape');
      await sleep(500);
    }
  }

  // ── Scene 4: Search for data (2s) ─────────────────────────────────
  console.log('Scene 4: Searching');
  const searchInput = await page.$('.search-input');
  if (searchInput) {
    await searchInput.click();
    await sleep(300);
    await page.keyboard.type('Product');
    await sleep(600);
    await capture(page, 1);
    // Clear search
    const clearBtn = await page.$('.search-clear');
    if (clearBtn) {
      await clearBtn.click();
      await sleep(300);
    }
    await capture(page, 3);
  }

  // ── Scene 5: Theme switch (3s) ────────────────────────────────────
  console.log('Scene 5: Theme switching');
  const themeTrigger = await page.$('.theme-trigger');
  if (themeTrigger) {
    await themeTrigger.click();
    await sleep(500);
    await capture(page, 1);

    // Click Ember theme
    await clickText(page, 'Ember');
    await sleep(1200);
    await capture(page, 4);

    // Back to Midnight
    await themeTrigger.click();
    await sleep(300);
    await clickText(page, 'Midnight');
    await sleep(600);
    await capture(page, 2);
  }

  // ── Scene 6: Scroll through data table (2s) ───────────────────────
  console.log('Scene 6: Data table');
  const tableWrap = await page.$('.table-wrap');
  if (tableWrap) {
    await tableWrap.evaluate((el) => el.scrollTop = 80);
    await sleep(500);
    await capture(page, 2);
    await tableWrap.evaluate((el) => el.scrollTop = 0);
    await sleep(300);
    await capture(page, 2);
  }

  // ── Scene 7: Full dashboard overview (2s) ─────────────────────────
  console.log('Scene 7: Dashboard overview');
  await capture(page, 4);

  console.log(`Captured ${frameIdx} frames. Encoding video...`);

  await browser.close();

  // ── Encode to MP4 ─────────────────────────────────────────────────
  const ffmpeg = ffmpegPath.path;
  const args = [
    '-y', '-framerate', String(FPS),
    '-i', resolve(FRAMES_DIR, 'frame-%06d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', 'fast', '-crf', '23',
    OUTPUT_PUBLIC,
  ];

  await new Promise((resolve, reject) => {
    execFile(ffmpeg, args, (err, stdout, stderr) => {
      if (err) {
        console.error('FFmpeg stderr:', stderr);
        reject(err);
        return;
      }
      console.log(`Video saved → ${OUTPUT_PUBLIC}`);
      console.log(`Copied to  → ${OUTPUT_ROOT}`);
      rmSync(FRAMES_DIR, { recursive: true, force: true });
      resolve();
    });
  });
}

main().catch((err) => {
  console.error('Recording failed:', err);
  process.exit(1);
});
