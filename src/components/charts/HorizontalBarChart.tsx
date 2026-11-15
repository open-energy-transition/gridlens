import { colorFor } from '../../lib/colors';

interface HorizontalBarChartProps {
  data: { name: string; count: number }[];
  colorIndex?: number;
}

/**
 * Ranked bar list: each row shows the full name with its count, and the bar
 * underneath. Long names wrap instead of being cut off or overlapping.
 */
export default function HorizontalBarChart({ data, colorIndex = 0 }: HorizontalBarChartProps) {
  const fill = colorFor(colorIndex);
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ol className="space-y-2.5">
      {data.map((d) => (
        <li key={d.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink-200">{d.name}</span>
            <span className="shrink-0 tabular-nums text-ink-400">{d.count}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-800" aria-hidden="true">
            <div className="h-2 rounded-full" style={{ width: `${(100 * d.count) / max}%`, background: fill }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
