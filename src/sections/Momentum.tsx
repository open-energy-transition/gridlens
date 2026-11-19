import { useMemo } from 'react';
import { useChart } from '../lib/chartFilters';
import { openShare, projectsPerYear } from '../lib/insights';
import { OPEN_SOURCE, PROPRIETARY } from '../lib/colors';
import ChartCard from '../components/chart/ChartCard';
import EmptyState from '../components/common/EmptyState';
import { LicenceLegend } from '../components/common/AdoptionRanking';

const THIS_YEAR = new Date().getFullYear();
const FROM = THIS_YEAR - 14;
const LAST = THIS_YEAR - 1;

/** Dated projects per year, open source stacked on proprietary, with the open-source share then and now. */
export default function Momentum() {
  const { records } = useChart('momentum');
  const years = useMemo(() => projectsPerYear(records, FROM, THIS_YEAR), [records]);
  const max = Math.max(1, ...years.map((y) => y.open + y.proprietary));
  // Compare the last complete year with five years before it; the current year is still being filled in.
  const last = years.find((y) => y.year === LAST)!;
  const base = years.find((y) => y.year === LAST - 5)!;
  const shareNow = openShare(records, LAST, LAST);
  const shareThen = openShare(records, LAST - 5, LAST - 5);
  const dated = years.reduce((a, y) => a + y.open + y.proprietary, 0);

  return (
    <ChartCard
      id="momentum"
      title="Projects per year"
      description="Projects per year of the study. A rising open-source share means new studies increasingly use tools anyone can inspect and reuse."
      fields={['country', 'toolName', 'sector', 'orgType', 'toolCategory', 'evidenceStrength', 'search']}
    >
      {dated === 0 ? (
        <EmptyState title="No dated projects for these filters" />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-end gap-x-12 gap-y-4">
            {shareNow !== null && (
              <div>
                <p className="font-display text-5xl text-brand-300">{Math.round(shareNow * 100)}%</p>
                <p className="mt-1 text-sm text-ink-400">
                  of {LAST}’s projects used open source
                  {shareThen !== null && <>, {shareNow >= shareThen ? 'up' : 'down'} from {Math.round(shareThen * 100)}% in {LAST - 5}</>}
                </p>
              </div>
            )}
            <div>
              <p className="font-display text-5xl text-ink-50">{last.open}</p>
              <p className="mt-1 text-sm text-ink-400">
                open-source projects in {LAST}
                {base.open > 0 && last.open !== base.open && <>, {last.open > base.open ? `${(last.open / base.open).toFixed(1)}× as many as` : 'fewer than'} in {LAST - 5}</>}
              </p>
            </div>
            <div className="sm:ml-auto"><LicenceLegend /></div>
          </div>
          <div className="flex h-56 items-end gap-[3px] sm:gap-1.5" role="img"
            aria-label={`Projects per year from ${FROM} to ${THIS_YEAR}, split into open-source and proprietary tools`}>
            {years.map((y) => {
              const total = y.open + y.proprietary;
              return (
                <div key={y.year} className="group relative flex h-full flex-1 flex-col justify-end" title={`${y.year}: ${total} projects, ${y.open} open source`}>
                  <span className="tabular mb-1 hidden text-center text-[10px] text-ink-500 sm:block">{total || ''}</span>
                  <div className="flex flex-col overflow-hidden rounded-t-sm" style={{ height: `${(100 * total) / max}%` }}>
                    <div style={{ flex: y.open, background: OPEN_SOURCE }} />
                    <div style={{ flex: y.proprietary, background: PROPRIETARY }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-[3px] sm:gap-1.5">
            {years.map((y, i) => (
              <span key={y.year} className="tabular flex-1 text-center text-[10px] text-ink-500">
                {i % 2 === (years.length - 1) % 2 ? `’${String(y.year).slice(2)}` : ''}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            {THIS_YEAR} is still in progress. Projects without a known year are not shown here.
          </p>
        </>
      )}
    </ChartCard>
  );
}
