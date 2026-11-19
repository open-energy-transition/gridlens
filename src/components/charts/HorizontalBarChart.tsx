import type { ReactNode } from 'react';
import { colorFor } from '../../lib/colors';

interface HorizontalBarChartProps {
  data: { name: string; count: number }[];
  colorIndex?: number;
  /** Optional element shown after each name, e.g. a licence badge. */
  badge?: (name: string) => ReactNode;
  /** Optional bar colour per row (overrides colorIndex), e.g. open source vs proprietary. */
  colorOf?: (name: string) => string;
}

/**
 * Ranked bar list: each row shows the full name with its count, and the bar
 * underneath. Long names wrap instead of being cut off or overlapping.
 */
export default function HorizontalBarChart({ data, colorIndex = 0, badge, colorOf }: HorizontalBarChartProps) {
  const fill = colorFor(colorIndex);
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ol className="space-y-2.5">
      {data.map((d) => (
        <li key={d.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex flex-wrap items-center gap-2 text-ink-200">
              {d.name}
              {badge?.(d.name)}
            </span>
            <span className="shrink-0 tabular-nums text-ink-400">{d.count}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-800" aria-hidden="true">
            <div className="h-2 rounded-full" style={{ width: `${(100 * d.count) / max}%`, background: colorOf?.(d.name) ?? fill }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
