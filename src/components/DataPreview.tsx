import type { ParsedFile } from '../utils/fileParser';
import type { ColumnStats } from '../utils/columnAnalyzer';

interface DataPreviewProps {
  parsed: ParsedFile;
  columns: ColumnStats[];
}

const PREVIEW_ROWS = 50;

export function DataPreview({ parsed, columns }: DataPreviewProps) {
  const typeByCol = new Map(columns.map((c) => [c.name, c.type]));
  const cols = parsed.columns;
  const rows = parsed.rows.slice(0, PREVIEW_ROWS);
  const total = parsed.rows.length;

  return (
    <>
      <div className="preview-head">
        <h2>Data</h2>
        <span>
          first {rows.length.toLocaleString()} of {total.toLocaleString()} rows \u00b7 {cols.length} columns
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
                  return (
                    <td key={c} className={cls}>
                      {display}
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
