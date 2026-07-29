import type { ParsedFile } from '../utils/fileParser';
import type { ColumnStats } from '../utils/columnAnalyzer';

interface DataPreviewProps {
  parsed: ParsedFile;
  columns: ColumnStats[];
  /** When set, matching substrings in cells are wrapped in <mark>. */
  searchQuery?: string;
}

const PREVIEW_ROWS = 50;

/**
 * Split text by a case-insensitive substring and wrap matches in <mark>.
 * Returns an array of React nodes (strings and <mark> elements).
 */
function highlightMatches(
  text: string,
  query: string,
): (string | JSX.Element)[] {
  if (!query) return [text];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: (string | JSX.Element)[] = [];
  let pos = 0;
  let idx = lower.indexOf(q, pos);
  while (idx !== -1) {
    if (idx > pos) parts.push(text.slice(pos, idx));
    parts.push(<mark key={idx}>{text.slice(idx, idx + q.length)}</mark>);
    pos = idx + q.length;
    idx = lower.indexOf(q, pos);
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return parts.length > 0 ? parts : [text];
}

export function DataPreview({ parsed, columns, searchQuery }: DataPreviewProps) {
  const typeByCol = new Map(columns.map((c) => [c.name, c.type]));
  const cols = parsed.columns;
  const rows = parsed.rows.slice(0, PREVIEW_ROWS);
  const total = parsed.rows.length;
  const q = searchQuery?.trim() ?? '';

  return (
    <>
      <div className="preview-head">
        <h2>Data</h2>
        <span>
          first {rows.length.toLocaleString()} of {total.toLocaleString()} rows · {cols.length} columns
        </span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-index">#</th>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="col-index">{i + 1}</td>
                {cols.map((c) => {
                  const v = r[c];
                  const type = typeByCol.get(c);
                  const display =
                    v === null || v === undefined || v === '' ? '\u2013' : String(v);
                  const cls =
                    type === 'number' ? 'is-num' : type === 'date' ? 'is-date' : '';

                  // Highlight matching cells when a search query is active.
                  const lowerDisplay = q ? display.toLowerCase() : '';
                  const lowerQ = q.toLowerCase();
                  const hasMatch = q && v != null && v !== '' && lowerDisplay.includes(lowerQ);
                  const cellCls = cls + (hasMatch ? ' is-match' : '');

                  return (
                    <td key={c} className={cellCls}>
                      {hasMatch ? highlightMatches(display, q) : display}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} className="empty-row">
                  No data rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
