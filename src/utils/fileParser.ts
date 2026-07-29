import Papa from 'papaparse';

export type Row = Record<string, string | number | boolean | null>;

export interface ParsedFile {
  fileName: string;
  fileSize: number;
  columns: string[];
  rows: Row[];
}

const TEXT_EXT = ['csv', 'tsv', 'txt', 'json'];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB safety cap

/**
 * Parses a single file into rows + columns.
 * Supports CSV/TSV/TXT (delimiter auto-detected) and JSON arrays.
 */
export function parseFile(file: File): Promise<ParsedFile> {
  if (file.size > MAX_BYTES) {
    return Promise.reject(new Error(`File is too large (${formatBytes(file.size)}). Cap is 50MB.`));
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!TEXT_EXT.includes(ext)) {
    return Promise.reject(new Error(`Unsupported file type: .${ext}. Use csv, tsv, txt, or json.`));
  }

  if (ext === 'json') {
    return readAsText(file).then((text) => parseJson(text, file.name, file.size));
  }
  return readAsText(file).then((text) => parseDelimited(text, file.name));
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'));
    reader.readAsText(file);
  });
}

function parseDelimited(text: string, fileName: string): ParsedFile {
  const result = Papa.parse<string[]>(text, {
    delimiter: '', // auto-detect: comma, tab, semicolon, pipe
    skipEmptyLines: 'greedy',
  });

  const raw = result.data.filter((r) => r.length > 0);

  if (raw.length === 0) {
    return { fileName, fileSize: text.length, columns: [], rows: [] };
  }

  // First non-empty row is the header.
  const header = raw[0].map((h, i) => (h && h.trim()) || `column_${i + 1}`);
  const dataRows = raw.slice(1);

  // Build column-oriented records. If a row is short, pad with null.
  // If a row is long, truncate extras (rare, but possible).
  const uniqueHeader = dedupeHeaders(header);

  const rows: Row[] = dataRows.map((cells) => {
    const obj: Row = {};
    for (let i = 0; i < uniqueHeader.length; i++) {
      const cell = cells[i] ?? '';
      const trimmed = cell.trim();
      obj[uniqueHeader[i]] = trimmed === '' ? null : trimmed;
    }
    return obj;
  });

  return {
    fileName,
    fileSize: text.length,
    columns: uniqueHeader,
    rows,
  };
}

function parseJson(text: string, fileName?: string, fileSize?: number): ParsedFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON file.');
  }

  // Accept: top-level array, or { rows: [...] }, or { data: [...] }
  let arr: unknown[];
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const candidate = obj.rows ?? obj.data ?? obj.records;
    if (Array.isArray(candidate)) {
      arr = candidate;
    } else {
      throw new Error('JSON must be an array of objects (or contain a "rows"/"data" array).');
    }
  } else {
    throw new Error('JSON must be an array of objects.');
  }

  if (arr.length === 0) {
    return { fileName: fileName ?? '', fileSize: fileSize ?? text.length, columns: [], rows: [] };
  }

  // Collect column names from union of keys.
  const colSet = new Set<string>();
  for (const item of arr) {
    if (item && typeof item === 'object') {
      Object.keys(item as Record<string, unknown>).forEach((k) => colSet.add(k));
    }
  }
  const columns = Array.from(colSet);

  const rows: Row[] = arr.map((item) => {
    if (!item || typeof item !== 'object') return null as unknown as Row;
    const obj = item as Record<string, unknown>;
    const out: Row = {};
    for (const c of columns) {
      const v = obj[c];
      if (v === null || v === undefined || v === '') {
        out[c] = null;
      } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        out[c] = v;
      } else {
        out[c] = String(v);
      }
    }
    return out;
  });

  return { fileName: fileName ?? '', fileSize: fileSize ?? text.length, columns, rows };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

// ── lightweight file preview (fast header + row count) ──────────────

export interface FilePreview {
  fileName: string;
  fileSize: number;
  columns: string[];
  rowCount: number;
}

/** Quick peek at a file's structure without full cell parsing. Returns
 *  column names and approximate row count in a fraction of the time of
 *  a full parse — ideal for folder file listings. */
export async function previewFile(file: File): Promise<FilePreview> {
  if (file.size > MAX_BYTES) {
    return { fileName: file.name, fileSize: file.size, columns: [], rowCount: 0 };
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!TEXT_EXT.includes(ext)) {
    return { fileName: file.name, fileSize: file.size, columns: [], rowCount: 0 };
  }

  const text = await readAsText(file);

  if (ext === 'json') {
    return previewJson(text, file.name, file.size);
  }
  return previewDelimited(text, file.name, file.size);
}

function previewDelimited(text: string, fileName: string, fileSize: number): FilePreview {
  // Fast preview: count newlines for rows, extract first line for headers.
  // Avoids Papa Parse overhead — stays O(n) string scanning.
  const lines = text.split('\n');

  // Find first non-empty line for header
  let headerLine = '';
  let rowCount = 0;
  let foundHeader = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (!foundHeader) {
      headerLine = trimmed;
      foundHeader = true;
    } else {
      rowCount++;
    }
  }

  if (!foundHeader || headerLine === '') {
    return { fileName, fileSize, columns: [], rowCount: 0 };
  }

  const columns = dedupeHeaders(
    smartSplit(headerLine).map((h, i) => (h && h.trim()) || `column_${i + 1}`),
  );

  return { fileName, fileSize, columns, rowCount };
}

/** Shared header deduplication (used by both preview and full parse). */
function dedupeHeaders(header: string[]): string[] {
  const seen = new Set<string>();
  return header.map((h) => {
    let name = h;
    let n = 2;
    while (seen.has(name)) name = `${h}_${n++}`;
    seen.add(name);
    return name;
  });
}

/** Smart split that handles quoted fields (CSV-aware). Does a fast
 *  single-pass parse of one line without the Papa Parse dependency. */
function smartSplit(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === '\t' || ch === ';' || ch === '|') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function previewJson(text: string, fileName: string, fileSize: number): FilePreview {
  try {
    const parsed = JSON.parse(text);
    let arr: unknown[];
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const candidate = obj.rows ?? obj.data ?? obj.records;
      arr = Array.isArray(candidate) ? candidate : [];
    } else {
      arr = [];
    }
    const colSet = new Set<string>();
    for (const item of arr) {
      if (item && typeof item === 'object') {
        Object.keys(item as Record<string, unknown>).forEach((k) => colSet.add(k));
      }
    }
    return { fileName, fileSize, columns: Array.from(colSet), rowCount: arr.length };
  } catch {
    return { fileName, fileSize, columns: [], rowCount: 0 };
  }
}
