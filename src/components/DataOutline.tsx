import { useMemo } from 'react';
import type { ColumnStats } from '../utils/columnAnalyzer';
import { formatNumber } from '../utils/columnAnalyzer';

interface DataOutlineProps {
  columns: ColumnStats[];
  totalRows: number;
  selected: string | null;
  onSelect: (col: string | null) => void;
}

export function DataOutline({ columns, totalRows, selected, onSelect }: DataOutlineProps) {
  const counts = useMemo(() => {
    const nums = columns.filter((c) => c.type === 'number').length;
    const dates = columns.filter((c) => c.type === 'date').length;
    const strings = columns.filter((c) => c.type === 'string').length;
    return { nums, dates, strings };
  }, [columns]);

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div>
          <strong>{totalRows.toLocaleString()}</strong>
          <span>rows</span>
        </div>
        <div>
          <strong>{columns.length}</strong>
          <span>
            cols \u00b7 {counts.nums}N {counts.dates}D {counts.strings}S
          </span>
        </div>
      </div>

      <div className="col-label">Columns</div>
      <div className="col-list">
        {columns.map((col) => {
          const isActive = selected === col.name;
          const meta = formatMeta(col);
          return (
            <button
              key={col.name}
              type="button"
              className={`col-row${isActive ? ' is-active' : ''}`}
              onClick={() => onSelect(isActive ? null : col.name)}
            >
              <div className="col-top">
                <span className="col-name">{col.name}</span>
                <span className="col-type">{col.type === 'number' ? 'num' : col.type === 'date' ? 'date' : 'str'}</span>
              </div>
              <div className="col-meta">{meta}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function formatMeta(col: ColumnStats): string {
  if (col.type === 'number' && col.numeric) {
    return `mean ${formatNumber(col.numeric.mean)} \u00b7 range ${formatNumber(col.numeric.min)}\u2013${formatNumber(col.numeric.max)}`;
  }
  if (col.type === 'date' && col.date) {
    return `${col.date.min.toISOString().slice(0, 10)} \u2192 ${col.date.max.toISOString().slice(0, 10)}`;
  }
  const nullPart = col.nullCount > 0 ? ` \u00b7 nulls ${col.nullCount}` : '';
  return `unique ${col.uniqueCount}${nullPart}`;
}
