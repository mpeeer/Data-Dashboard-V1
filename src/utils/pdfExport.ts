// PDF builders using pdf-lib. Two outputs:
//   - buildReportPdf  : findings paragraphs + chart pages. Text-heavy.
//   - buildChartsPdf   : just the charts on pages. Image-heavy.

import { PDFDocument, PDFFont, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import type { ColumnStats } from './columnAnalyzer';
import type { Insight } from './insights';
import { chartRender } from './chartRender';

interface ChartImg {
  title: string;
  caption?: string;
  png: string; // data URL
}

interface ReportInput {
  fileName: string;
  totalRows: number;
  columns: ColumnStats[];
  insights: Insight[];
  charts: ChartImg[];
}

const [PAGE_W, PAGE_H] = PageSizes.Letter;
const MARGIN = 54; // ~ 0.75 inch
const BODY_SIZE = 10.5;
const H1_SIZE = 15;
const H2_SIZE = 11.5;
const META_COLOR = rgb(0.45, 0.45, 0.5);
const TEXT_COLOR = rgb(0.13, 0.13, 0.16);
const HEADING_COLOR = rgb(0.1, 0.1, 0.13);
const RULE_COLOR = rgb(0.85, 0.85, 0.88);

const wrapLine = (
  text: string,
  font: { widthOfTextAtSize: (s: string, size: number) => number },
  size: number,
  maxWidth: number
): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const trial = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(trial, size) > maxWidth) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
};

function drawHeader(
  page: import('pdf-lib').PDFPage,
  ctx: PdfCtx,
  meta: { fileName: string; subtitle: string; }
): number {
  const helv = ctx.font;
  const helvBold = ctx.fontBold;

  page.drawText(meta.fileName, {
    x: MARGIN,
    y: PAGE_H - MARGIN,
    size: H1_SIZE,
    font: helvBold,
    color: HEADING_COLOR,
  });

  page.drawText(meta.subtitle, {
    x: MARGIN,
    y: PAGE_H - MARGIN - 18,
    size: 9,
    font: helv,
    color: META_COLOR,
  });

  // hairline under the title
  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - MARGIN - 28 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - MARGIN - 28 },
    thickness: 0.5,
    color: RULE_COLOR,
  });

  return PAGE_H - MARGIN - 44;
}

interface PdfCtx {
  doc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
}

async function newDoc(): Promise<PdfCtx> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { doc, font, fontBold };
}

// ---------- REPORT PDF ----------

export async function buildReportPdf(input: ReportInput): Promise<Uint8Array> {
  const ctx = await newDoc();
  let page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  const font = ctx.font;
  const fontBold = ctx.fontBold;

  let cursorY = drawHeader(page, ctx, {
    fileName: input.fileName,
    subtitle: `${input.totalRows.toLocaleString()} rows · ${input.columns.length} columns`,
  });

  // Introduction.
  page.drawText('Findings', {
    x: MARGIN,
    y: cursorY,
    size: H2_SIZE,
    font: fontBold,
    color: HEADING_COLOR,
  });
  cursorY -= 16;
  page.drawLine({
    start: { x: MARGIN, y: cursorY + 4 },
    end: { x: PAGE_W - MARGIN, y: cursorY + 4 },
    thickness: 0.3,
    color: RULE_COLOR,
  });
  cursorY -= 8;

  for (const item of input.insights) {
    // Page break check (approx).
    if (cursorY < MARGIN + 36) {
      page = ctx.doc.addPage([PAGE_W, PAGE_H]);
      cursorY = PAGE_H - MARGIN;
    }

    page.drawText(item.title, {
      x: MARGIN,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: HEADING_COLOR,
    });
    cursorY -= 14;

    const maxWidth = PAGE_W - MARGIN * 2;
    const lines = wrapLine(item.body, font, BODY_SIZE, maxWidth);
    for (const line of lines) {
      if (cursorY < MARGIN + 12) {
        page = ctx.doc.addPage([PAGE_W, PAGE_H]);
        cursorY = PAGE_H - MARGIN;
      }
      page.drawText(line, {
        x: MARGIN,
        y: cursorY,
        size: BODY_SIZE,
        font,
        color: TEXT_COLOR,
      });
      cursorY -= 14;
    }
    cursorY -= 10;
  }

  // Charts section.
  for (const ch of input.charts) {
    page = ctx.doc.addPage([PAGE_W, PAGE_H]);
    cursorY = drawHeader(page, ctx, {
      fileName: ch.title,
      subtitle: 'Figure from loaded dataset',
    });

    // Embed chart image.
    try {
      const pngBytes = dataUrlToBytes(ch.png);
      const png = await ctx.doc.embedPng(pngBytes);
      const usableW = PAGE_W - MARGIN * 2;
      const usableH = PAGE_H - MARGIN - cursorY - 20;
      const scale = Math.min(usableW / png.width, usableH / png.height, 1);
      const drawW = png.width * scale;
      const drawH = png.height * scale;
      page.drawImage(png, {
        x: (PAGE_W - drawW) / 2,
        y: cursorY - drawH,
        width: drawW,
        height: drawH,
      });
      if (ch.caption) {
        page.drawText(ch.caption, {
          x: MARGIN,
          y: MARGIN,
          size: 9,
          font,
          color: META_COLOR,
        });
      }
    } catch (err) {
      page.drawText('(figure could not be embedded)', {
        x: MARGIN,
        y: cursorY - 20,
        size: 9,
        font,
        color: META_COLOR,
      });
    }
  }

  return await ctx.doc.save();
}

// ---------- CHARTS PDF ----------

export async function buildChartsPdf(input: { fileName: string; totalRows: number; charts: ChartImg[] }): Promise<Uint8Array> {
  const ctx = await newDoc();
  const font = ctx.font;

  for (const ch of input.charts) {
    const page = ctx.doc.addPage([PAGE_W, PAGE_H]);
    let cursorY = drawHeader(page, ctx, {
      fileName: ch.title,
      subtitle: `${input.totalRows.toLocaleString()} rows · chart from loaded dataset`,
    });

    // small label / caption line under the title block:
    page.drawText(ch.caption ?? 'Distribution / aggregation from your data', {
      x: MARGIN,
      y: cursorY - 12,
      size: 9,
      font,
      color: META_COLOR,
    });
    cursorY -= 28;

    try {
      const pngBytes = dataUrlToBytes(ch.png);
      const png = await ctx.doc.embedPng(pngBytes);
      const usableW = PAGE_W - MARGIN * 2;
      const usableH = PAGE_H - MARGIN - cursorY - 24;
      const scale = Math.min(usableW / png.width, usableH / png.height, 1);
      const drawW = png.width * scale;
      const drawH = png.height * scale;
      page.drawImage(png, {
        x: (PAGE_W - drawW) / 2,
        y: cursorY - drawH,
        width: drawW,
        height: drawH,
      });
    } catch {
      page.drawText('(figure could not be embedded)', {
        x: MARGIN,
        y: cursorY - 20,
        size: 9,
        font,
        color: META_COLOR,
      });
    }
  }

  // Add a small final page with chart count + footer.
  const page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  drawHeader(page, ctx, {
    fileName: 'Summary',
    subtitle: `${input.charts.length} chart${input.charts.length === 1 ? '' : 's'} from ${input.fileName}`,
  });
  page.drawText(
    `Total rows in source dataset: ${input.totalRows.toLocaleString()}. ` +
    `Charts rendered from the dataset loaded into Lumen at export time.`,
    {
      x: MARGIN,
      y: PAGE_H - MARGIN - 60,
      size: BODY_SIZE,
      font,
      color: TEXT_COLOR,
      maxWidth: PAGE_W - MARGIN * 2,
    }
  );

  return await ctx.doc.save();
}

// ---------- HELPERS ----------

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  const b64 = dataUrl.slice(comma + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------- PUBLIC: builds chart PNGs from raw data ----------

import type { Row } from './fileParser';

interface BuildChartsInput {
  rows: Row[];
  columns: ColumnStats[];
  selected: string | null;
}

const collectNumeric = (rows: Row[], col: string): number[] => {
  const out: number[] = [];
  for (const r of rows) {
    const v = r[col];
    if (v === null || v === undefined || v === '') continue;
    const n = Number(v);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
};

const aggregateByDate = (rows: Row[], dateCol: string, numCol: string) => {
  const pts: { raw: Date; x: string; y: number }[] = [];
  for (const row of rows) {
    const dRaw = row[dateCol];
    const nRaw = row[numCol];
    if (dRaw === null || nRaw === null) continue;
    const d = new Date(String(dRaw));
    const n = Number(nRaw);
    if (Number.isNaN(d.getTime()) || !Number.isFinite(n)) continue;
    pts.push({ raw: d, x: d.toISOString().slice(0, 10), y: n });
  }
  pts.sort((a, b) => a.raw.getTime() - b.raw.getTime());
  const groups = new Map<string, { sum: number; count: number }>();
  for (const p of pts) {
    const cur = groups.get(p.x) ?? { sum: 0, count: 0 };
    cur.sum += p.y;
    cur.count += 1;
    groups.set(p.x, cur);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, g]) => ({ x, y: g.sum / g.count }));
};

const aggregateByCategory = (rows: Row[], catCol: string, numCol: string) => {
  const groups = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const c = r[catCol];
    const n = r[numCol];
    if (c === null || n === null) continue;
    const num = Number(n);
    if (!Number.isFinite(num)) continue;
    const key = String(c);
    const cur = groups.get(key) ?? { sum: 0, count: 0 };
    cur.sum += num;
    cur.count += 1;
    groups.set(key, cur);
  }
  return Array.from(groups.entries())
    .map(([label, g]) => ({ label, mean: g.sum / g.count, count: g.count }))
    .filter((a) => a.count >= 1);
};

const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e4) return n.toLocaleString();
  if (Math.abs(n) >= 1e3) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
};

interface ExportableChart {
  title: string;
  caption: string;
  png: string;
}

async function buildChartImages(input: BuildChartsInput): Promise<ExportableChart[]> {
  // Mirror ChartsPanel's logic so the report matches what's on screen.
  const stats = input.columns;
  const targeted = input.selected
    ? stats.filter((s) => s.name === input.selected)
    : stats;

  const nums: ColumnStats[] = [];
  const strings: ColumnStats[] = [];
  const dates: ColumnStats[] = [];
  for (const s of targeted) {
    if (s.type === 'number') nums.push(s);
    else if (s.type === 'date') dates.push(s);
    else strings.push(s);
  }

  const out: ExportableChart[] = [];

  for (const c of nums.slice(0, 4)) {
    const values = collectNumeric(input.rows, c.name);
    if (values.length === 0) continue;
    const png = await chartRender.histogram(values, c.name);
    out.push({
      title: `Distribution of ${c.name}`,
      caption: `${values.length.toLocaleString()} values · mean ${fmt(c.numeric!.mean)} · σ ${fmt(c.numeric!.stdev)}`,
      png,
    });
  }

  if (!input.selected || strings.length > 0) {
    const list = input.selected ? strings : strings.slice(0, 2);
    for (const c of list) {
      if (!c.categories || c.categories.length === 0) continue;
      const top = c.categories.slice(0, 8);
      const png = await chartRender.categoryHorizontal(
        top.map((t) => t.value),
        top.map((t) => t.count),
        c.name
      );
      out.push({
        title: `${c.name} breakdown`,
        caption: `Top ${top.length} of ${c.uniqueCount.toLocaleString()} values`,
        png,
      });
    }
  }

  if (dates.length > 0 && nums.length > 0) {
    const dateCol = dates[0].name;
    const numCol = nums[0].name;
    const ts = aggregateByDate(input.rows, dateCol, numCol);
    if (ts.length >= 3) {
      const png = await chartRender.line(
        ts.map((p) => p.x),
        ts.map((p) => p.y),
        numCol
      );
      out.push({
        title: `${numCol} over ${dateCol}`,
        caption: `${ts.length} time points`,
        png,
      });
    }
  }

  if (!input.selected && nums.length > 0 && strings.length > 0) {
    const candidates = strings.slice(0, 2);
    const numCol = nums[0].name;
    for (const c of candidates) {
      const aggs = aggregateByCategory(input.rows, c.name, numCol);
      if (aggs.length < 2) continue;
      const top = [...aggs].sort((a, b) => b.mean - a.mean).slice(0, 8);
      const png = await chartRender.barVertical(
        top.map((t) => t.label),
        top.map((t) => t.mean),
        numCol
      );
      out.push({
        title: `Mean ${numCol} by ${c.name}`,
        caption: `Top ${top.length} of ${c.uniqueCount.toLocaleString()} categories`,
        png,
      });
    }
  }

  const donutStr = strings[0];
  if (donutStr?.categories) {
    const top = donutStr.categories.slice(0, 6);
    if (top.length >= 2) {
      const png = await chartRender.doughnut(
        top.map((t) => t.value),
        top.map((t) => t.count),
        donutStr.name
      );
      out.push({
        title: `${donutStr.name} share`,
        caption: `Top ${top.length} of ${donutStr.uniqueCount.toLocaleString()} values`,
        png,
      });
    }
  }

  return out;
}

// ---------- PUBLIC API: produces finished PDFs ----------

export async function generateReport(input: BuildChartsInput & { fileName: string; insights: Insight[] }) {
  const charts = await buildChartImages(input);
  return buildReportPdf({
    fileName: input.fileName,
    totalRows: input.rows.length,
    columns: input.columns,
    insights: input.insights,
    charts,
  });
}

export async function generateCharts(input: BuildChartsInput & { fileName: string }) {
  const charts = await buildChartImages(input);
  return buildChartsPdf({
    fileName: input.fileName,
    totalRows: input.rows.length,
    charts: charts.map((c) => ({ title: c.title, caption: c.caption, png: c.png })),
  });
}
