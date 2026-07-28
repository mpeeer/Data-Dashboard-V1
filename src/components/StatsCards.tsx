import type { ColumnStats } from '../utils/columnAnalyzer';
import { formatNumber } from '../utils/columnAnalyzer';

interface StatsCardsProps {
  columns: ColumnStats[];
  totalRows: number;
}

export function StatsCards({ columns, totalRows }: StatsCardsProps) {
  const nums = columns.filter((c) => c.type === 'number');
  const dates = columns.filter((c) => c.type === 'date');
  const strings = columns.filter((c) => c.type === 'string');

  // Top numeric columns by stdev (most interesting first).
  const topNums = [...nums]
    .sort((a, b) => (b.numeric?.stdev ?? 0) - (a.numeric?.stdev ?? 0))
    .slice(0, 3);

  const cards: { label: string; value: string; sub?: string }[] = [
    {
      label: 'Rows',
      value: totalRows.toLocaleString(),
      sub: `${columns.length} columns · ${nums.length} numeric · ${dates.length} date · ${strings.length} text`,
    },
  ];

  for (const n of topNums) {
    const stat = n.numeric!;
    cards.push({
      label: `Mean of ${n.name}`,
      value: formatNumber(stat.mean),
      sub: `σ ${formatNumber(stat.stdev)} · range ${formatNumber(stat.min)}–${formatNumber(stat.max)}`,
    });
  }

  return (
    <div className="summary-row">
      {cards.map((c, i) => (
        <div key={i} className="glass stat-card">
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value}</div>
          {c.sub && <div className="stat-sub">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
