// Smoke test for the PDF export pipeline.
// Exercises the real `columnAnalyzer.ts` + `insights.ts` source (they run fine
// in pure Node — no DOM dependencies), then builds a PDF via pdf-lib in the
// same shape as `src/utils/pdfExport.ts → buildReportPdf`. Verifies the output
// is a real PDF (starts with `%PDF-`, size makes sense) so we have hard
// evidence the data + PDF pipeline works in this environment.
//
// Run: `npx tsx scripts/verify-export.mts`

import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import { analyzeColumns } from '../src/utils/columnAnalyzer';
import { generateInsights } from '../src/utils/insights';

// 1x1 transparent PNG (valid bytes for pdf-lib's embedPng)
const TINY_PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  ),
  (c) => c.charCodeAt(0)
);

const REGIONS = ['North', 'South', 'East', 'West'] as const;

function synthDataset() {
  const rows = [];
  const start = new Date('2024-01-01T00:00:00Z');
  for (let i = 0; i < 50; i++) {
    rows.push({
      sample_id: i + 1,
      temperature: Number((18 + Math.sin(i / 5) * 4 + (Math.random() - 0.5)).toFixed(2)),
      humidity: Number((50 + Math.cos(i / 4) * 8 + (Math.random() - 0.5) * 2).toFixed(2)),
      ph: Number((6.8 + (Math.random() - 0.5) * 0.4).toFixed(2)),
      region: REGIONS[i % 4],
      measured_at: new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10),
    });
  }
  return rows;
}

// Mirror of buildReportPdf from src/utils/pdfExport.ts — same primitives,
// same page sizes, font handling, layout. We don't import buildReportPdf
// because that file transitively imports chartRender → chart.js, which needs
// a browser DOM that Node doesn't have.
async function buildReportLikePdf(input: {
  fileName: string;
  totalRows: number;
  colNames: string[];
  rows: ReturnType<typeof synthDataset>;
}) {
  // Run the real analyzers from src/.
  const stats = analyzeColumns(input.rows, input.colNames);
  const insights = generateInsights(stats, input.rows);

  const [PW, PH] = PageSizes.Letter;
  const MARGIN = 54;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PW, PH]);

  page.drawText(input.fileName, {
    x: MARGIN,
    y: PH - MARGIN,
    size: 15,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.13),
  });
  page.drawText(`${input.totalRows.toLocaleString()} rows · ${input.colNames.length} columns`, {
    x: MARGIN,
    y: PH - MARGIN - 18,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.5),
  });
  page.drawLine({
    start: { x: MARGIN, y: PH - MARGIN - 28 },
    end: { x: PW - MARGIN, y: PH - MARGIN - 28 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.88),
  });

  let cursorY = PH - MARGIN - 44;
  page.drawText('Findings', {
    x: MARGIN,
    y: cursorY,
    size: 11.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.13),
  });
  cursorY -= 16;
  page.drawLine({
    start: { x: MARGIN, y: cursorY + 4 },
    end: { x: PW - MARGIN, y: cursorY + 4 },
    thickness: 0.3,
    color: rgb(0.85, 0.85, 0.88),
  });
  cursorY -= 8;

  for (const item of insights) {
    if (cursorY < MARGIN + 36) {
      page = doc.addPage([PW, PH]);
      cursorY = PH - MARGIN;
    }
    page.drawText(item.title, {
      x: MARGIN,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.13),
    });
    cursorY -= 14;

    const maxW = PW - MARGIN * 2;
    const words = item.body.split(/\s+/);
    let line = '';
    for (const w of words) {
      const trial = line ? line + ' ' + w : w;
      if (font.widthOfTextAtSize(trial, 10.5) > maxW) {
        if (line) {
          page.drawText(line, {
            x: MARGIN,
            y: cursorY,
            size: 10.5,
            font,
            color: rgb(0.13, 0.13, 0.16),
          });
          cursorY -= 14;
        }
        line = w;
      } else {
        line = trial;
      }
    }
    if (line) {
      page.drawText(line, {
        x: MARGIN,
        y: cursorY,
        size: 10.5,
        font,
        color: rgb(0.13, 0.13, 0.16),
      });
      cursorY -= 14;
    }
    cursorY -= 10;
  }

  // Chart placeholder page (mirrors the chart-pages loop in buildReportPdf).
  const chartPage = doc.addPage([PW, PH]);
  const png = await doc.embedPng(TINY_PNG);
  chartPage.drawImage(png, {
    x: (PW - 200) / 2,
    y: (PH - 200) / 2,
    width: 200,
    height: 200,
  });
  chartPage.drawText('(Chart rendered from your data in the browser)', {
    x: MARGIN,
    y: MARGIN,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.5),
  });

  return doc.save();
}

async function main() {
  const rows = synthDataset();
  const colNames = Object.keys(rows[0]);
  console.log(`dataset: ${rows.length} rows · ${colNames.length} cols`);
  console.log(`columns: ${colNames.join(', ')}`);

  // Real type inference from the source.
  const stats = analyzeColumns(rows, colNames);
  console.log(
    'types:',
    stats.map((s) => `${s.name}=${s.type}`).join('  ')
  );

  // Real insight generation from the source.
  const insights = generateInsights(stats, rows);
  console.log(`insights generated: ${insights.length}`);
  for (const ins of insights.slice(0, 3)) {
    console.log(`  • [${ins.title}] ${ins.body.slice(0, 90)}${ins.body.length > 90 ? '…' : ''}`);
  }

  // Build a PDF mirroring the production buildReportPdf shape.
  const bytes = await buildReportLikePdf({
    fileName: 'sample-data.csv',
    totalRows: rows.length,
    colNames,
    rows,
  });

  const outPath = join(tmpdir(), 'lumen-verify-report.pdf');
  writeFileSync(outPath, bytes);
  console.log(`wrote ${bytes.length} bytes → ${outPath}`);

  // Verify the bytes are a real PDF.
  const header = new TextDecoder('latin1').decode(bytes.slice(0, 5));
  const isValidPdf = header === '%PDF-';
  const isSizable = bytes.length > 2000;
  const pass = isValidPdf && isSizable;

  console.log('---');
  console.log(`header:        ${JSON.stringify(header)}`);
  console.log(`expected:      "%PDF-"`);
  console.log(`size:          ${bytes.length}B  (expect > 2_000)`);
  console.log(`matches:       ${isValidPdf}`);
  console.log(`size ok:       ${isSizable}`);
  console.log(`VERIFY:        ${pass ? 'PASS ✓' : 'FAIL ✗'}`);

  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error('SMOKE ERROR:', err);
  process.exit(2);
});
