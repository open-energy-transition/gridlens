import type { ReactNode } from 'react';
import { colorFor } from '../../lib/colors';
import { Link } from '../../lib/router';

interface HorizontalBarChartProps {
  data: { name: string; count: number }[];
  colorIndex?: number;
  /** Optional element shown after each name, e.g. a licence badge. */
  badge?: (name: string) => ReactNode;
  /** Optional bar colour per row (overrides colorIndex), e.g. open source vs proprietary. */
  colorOf?: (name: string) => string;
  /** Optional in-app link per row (the whole row is clickable), e.g. the tool's profile. */
  hrefOf?: (name: string) => string | undefined;
  /** What the numbers count ("organizations"): shown above the numbers and in each row's tooltip. */
  unit?: string;
  /** Heading above the names ("Tool"). */
  label?: string;
  /** Show rank numbers. */
  ranked?: boolean;
  /** Optional element before each name, e.g. a logo. */
  icon?: (name: string) => ReactNode;
  /** Optional split of each bar into parts (adding up to its count), drawn left to right, e.g. by sector. */
  segmentsOf?: (name: string) => { label: string; count: number; color: string }[];
}

/**
 * Ranked bars. On wide screens the name sits left of the bar, as in a leaderboard;
 * on phones the name is above its bar so long names are never cut off.
 */
export default function HorizontalBarChart({ data, colorIndex = 0, badge, colorOf, hrefOf, unit = '', label = '', ranked = false, icon, segmentsOf }: HorizontalBarChartProps) {
  const fill = colorFor(colorIndex);
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <>
    {unit && (
      <p className="mb-1 flex justify-between px-2 text-xs text-ink-500" aria-hidden="true">
        <span className={ranked ? 'pl-7' : ''}>{label}</span><span>{unit[0].toUpperCase() + unit.slice(1)}</span>
      </p>
    )}
    <ol className="group/list space-y-2 sm:space-y-0.5">
      {data.map((d, i) => {
        const href = hrefOf?.(d.name);
        const row = 'grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-1 transition-[opacity,background-color] duration-150 hover:bg-ink-800/50 group-hover/list:opacity-50 hover:!opacity-100 sm:grid-cols-[minmax(10rem,17rem)_1fr_3rem]';
        const inner = (
          <>
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-200">
              {ranked && <span className="tabular w-5 shrink-0 text-xs text-ink-600">{i + 1}</span>}
              {icon?.(d.name)}
              <span className={href ? 'underline decoration-ink-700 underline-offset-4 group-hover/row:text-ink-50 group-hover/row:decoration-brand-500' : ''}>{d.name}</span>
              {badge?.(d.name)}
            </span>
            <span className="tabular text-right text-sm text-ink-300 sm:order-last">{d.count}</span>
            <div className="col-span-2 h-1.5 rounded-sm bg-ink-800/60 sm:col-span-1 sm:h-[18px]" aria-hidden="true">
              <div className="flex h-full overflow-hidden rounded-sm transition-[width] duration-500" style={{ width: `${Math.max(1.5, (100 * d.count) / max)}%` }}>
                {(segmentsOf?.(d.name) ?? [{ label: '', count: d.count, color: colorOf?.(d.name) ?? fill }]).filter((s) => s.count > 0).map((s) => (
                  <div key={s.label} className="h-full" style={{ width: `${(100 * s.count) / Math.max(1, d.count)}%`, background: s.color }} />
                ))}
              </div>
            </div>
          </>
        );
        return (
          <li key={d.name} title={`${d.name}: ${d.count} ${unit}${segmentsOf ? ` (${segmentsOf(d.name).filter((s) => s.count).map((s) => `${s.label} ${s.count}`).join(', ')})` : ''}`.trim()}>
            {href ? <Link href={href} className={`group/row ${row}`}>{inner}</Link> : <div className={row}>{inner}</div>}
          </li>
        );
      })}
    </ol>
    </>
  );
}
