import { useMemo } from 'react';
import { MAP_SCALE, MAP_NO_DATA, bucketIndexFor } from '../../lib/colors';

interface MapLegendProps {
  maxValue: number;
  unitLabel?: string;
}

/**
 * A discrete, numerically-labeled choropleth legend (journal-figure style:
 * stepped color bins with real value ranges, not just vague "Low/High"
 * text). Ranges are derived by brute-force enumerating every integer value
 * from 1..maxValue through the exact same bucketIndexFor() the map itself
 * uses, so the legend is always perfectly consistent with what's rendered
 * -- it can never drift out of sync with a hand-maintained threshold list.
 */
export default function MapLegend({ maxValue, unitLabel = 'records' }: MapLegendProps) {
  const bins = useMemo(() => {
    const ranges = new Map<number, [number, number]>();
    for (let v = 1; v <= Math.max(0, Math.round(maxValue)); v++) {
      const idx = bucketIndexFor(v, maxValue);
      if (idx < 0) continue;
      const existing = ranges.get(idx);
      if (!existing) ranges.set(idx, [v, v]);
      else existing[1] = v;
    }
    return Array.from(ranges.entries())
      .map(([idx, [lo, hi]]) => ({ idx, lo, hi, color: MAP_SCALE[idx] }))
      .sort((a, b) => b.idx - a.idx); // highest bucket first, like a journal-figure ramp
  }, [maxValue]);

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 pt-3 lg:w-36 lg:pt-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{unitLabel} per country</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col">
        {bins.map(({ idx, lo, hi, color }) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-ink-400">{lo === hi ? lo : `${lo}\u2013${hi}`}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 lg:mt-1">
          <span className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: MAP_NO_DATA }} />
          <span className="text-[11px] text-ink-600">No evidence yet</span>
        </div>
      </div>
    </div>
  );
}
