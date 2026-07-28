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
  const grouped = useMemo(() => {
    const nums = columns.filter((c) => c.type === 'number');
    const dates = columns.filter((c) => c.type === 'date');
    const strings = columns.filter((c) => c.type === 'string');
    return { nums, dates, strings };
  }, [columns]);

  return (
    <aside className="glass-strong sidebar">
      <h2>Data Outline</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 18,
          fontSize: 12,
        }}
      >
        <Mini label="Rows" value={totalRows.toLocaleString()} />
        <Mini label="Columns" value={columns.length.toString()} />
        <Mini label="Types" value={`${grouped.nums.length}N · ${grouped.dates.length}D · ${grouped.strings.length}S`} />
      </div>

      <div className="col-list">
        {columns.map((col) => {
          const isActive = selected === col.name;
          return (
            <button
              key={col.name}
              type="button"
              className={`col-card${isActive ? ' is-active' : ''}`}
              onClick={() => onSelect(isActive ? null : col.name)}
              style={{
                outline: 'none',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                width: '100%',
              }}
            >
              <div className="col-name">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {col.name}
                </span>
                <span className={`type-badge is-${col.type}`}>{col.type.slice(0, 3)}</span>
              </div>
              <div className="col-stats">
                {col.type === 'number' && col.numeric && (
                  <>
                    mean <strong>{formatNumber(col.numeric.mean)}</strong> · range{' '}
                    <strong>
                      {formatNumber(col.numeric.min)} – {formatNumber(col.numeric.max)}
                    </strong>
                  </>
                )}
                {col.type === 'date' && col.date && (
                  <>
                    {col.date.min.toISOString().slice(0, 10)} →{' '}
                    {col.date.max.toISOString().slice(0, 10)} (
                    {col.date.spanDays.toLocaleString()}d)
                  </>
                )}
                {col.type === 'string' && (
                  <>
                    unique <strong>{col.uniqueCount}</strong>
                    {col.nullCount > 0 && <> · nulls <strong>{col.nullCount}</strong></>}
                  </>
                )}
              </div>
              {col.samples.length > 0 && (
                <div className="col-samples">{col.samples.join(' · ')}</div>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '8px 10px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-mute)',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}
