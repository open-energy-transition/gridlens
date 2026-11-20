import { useState } from 'react';
import { OPEN_SOURCE, PROPRIETARY } from '../../lib/colors';

export interface YearCount {
  year: number;
  open: number;
  proprietary: number;
}

/**
 * Stacked columns per year (open source on top of proprietary). Hovering or tapping a year shows its
 * numbers and dims the other years.
 */
export default function YearBars({ years, split = true, color = OPEN_SOURCE }: { years: YearCount[]; split?: boolean; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...years.map((y) => y.open + y.proprietary));
  const h = hover === null ? null : years[hover];
  const total = h ? h.open + h.proprietary : 0;
  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <div className="flex h-56 items-end gap-[3px] sm:gap-1.5" role="img" aria-label={`Projects per year, ${years[0]?.year}–${years.at(-1)?.year}`}>
        {years.map((y, i) => {
          const n = y.open + y.proprietary;
          return (
            <button key={y.year} type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)}
              aria-label={`${y.year}: ${n} projects, ${y.open} open source`}
              className={`flex h-full flex-1 flex-col justify-end outline-none transition-opacity duration-150 ${hover !== null && hover !== i ? 'opacity-35' : ''}`}>
              <span className="tabular mb-1 hidden text-center text-[10px] text-ink-500 sm:block">{n || ''}</span>
              <span className="flex flex-col overflow-hidden rounded-t-sm" style={{ height: `${(100 * n) / max}%` }}>
                {split ? (
                  <>
                    <span style={{ flex: y.open, background: OPEN_SOURCE }} />
                    <span style={{ flex: y.proprietary, background: PROPRIETARY }} />
                  </>
                ) : <span className="flex-1" style={{ background: color }} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1.5">
        {years.map((y, i) => (
          <span key={y.year} className={`tabular flex-1 text-center text-[10px] ${hover === i ? 'text-ink-50' : 'text-ink-500'}`}>
            {hover === i || i % 2 === (years.length - 1) % 2 ? `’${String(y.year).slice(2)}` : ''}
          </span>
        ))}
      </div>
      {h && (
        <div className="pointer-events-none absolute top-0 z-10 w-44 rounded-xl border border-ink-700 bg-ink-950/95 p-3 text-xs shadow-2xl backdrop-blur"
          style={hover! >= years.length / 2
            ? { right: `calc(${(1 - hover! / years.length) * 100}% + 8px)` }
            : { left: `calc(${((hover! + 1) / years.length) * 100}% + 8px)` }}>
          <p className="font-display text-lg text-ink-50">{h.year}</p>
          <p className="mt-1 flex justify-between text-ink-300"><span>Projects</span><span className="tabular text-ink-50">{total}</span></p>
          {split && (
            <>
              <p className="flex justify-between text-ink-300"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: OPEN_SOURCE }} />Open source</span><span className="tabular">{h.open}</span></p>
              <p className="flex justify-between text-ink-300"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: PROPRIETARY }} />Proprietary</span><span className="tabular">{h.proprietary}</span></p>
              {total > 0 && <p className="mt-1 border-t border-ink-800 pt-1 text-ink-400">{Math.round((100 * h.open) / total)}% open source</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
