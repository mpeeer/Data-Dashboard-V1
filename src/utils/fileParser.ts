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
  const seen = new Set<string>();
  const uniqueHeader = header.map((h) => {
    let name = h;
    let n = 2;
    while (seen.has(name)) {
      name = `${h}_${n++}`;
    }
    seen.add(name);
    return name;
  });

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
