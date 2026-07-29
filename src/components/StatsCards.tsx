import type { ColumnStats } from '../utils/columnAnalyzer';
import { formatNumber } from '../utils/columnAnalyzer';

interface StatsCardsProps {
  columns: ColumnStats[];
  totalRows: number;
}

export function StatsCards({ columns, totalRows }: StatsCardsProps) {
  const nums = columns.filter((c) => c.type === 'number');

  // Top numeric columns by stdev (most interesting first).
  const topNums = [...nums]
    .sort((a, b) => (b.numeric?.stdev ?? 0) - (a.numeric?.stdev ?? 0))
    .slice(0, 3);

  const cards: { label: string; value: string; sub?: string }[] = [
    {
      label: 'Rows',
      value: totalRows.toLocaleString(),
      sub: `${columns.length} columns`,
    },
  ];

  for (const n of topNums) {
    const stat = n.numeric!;
    cards.push({
      label: `Mean of ${n.name}`,
      value: formatNumber(stat.mean),
      sub: `range ${formatNumber(stat.min)}\u2013${formatNumber(stat.max)}`,
    });
  }

  return (
    <div className="summary-row">
      {cards.map((c, i) => (
        <div key={i} className="stat-card">
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value}</div>
          {c.sub && <div className="stat-sub">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
