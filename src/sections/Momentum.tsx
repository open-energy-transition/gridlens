import { useMemo } from 'react';
import { useChart } from '../lib/chartFilters';
import { openShare, projectsPerYear } from '../lib/insights';
import ChartCard from '../components/chart/ChartCard';
import EmptyState from '../components/common/EmptyState';
import { LicenceLegend } from '../components/common/AdoptionRanking';
import YearBars from '../components/charts/YearBars';
import CoverageBar from '../components/charts/CoverageBar';

const THIS_YEAR = new Date().getFullYear();
const FROM = THIS_YEAR - 14;
const LAST = THIS_YEAR - 1;

/** Dated projects per year, open source stacked on proprietary, with the open-source share then and now. */
export default function Momentum() {
  // The chart is itself a timeline: the study-year filter does not apply.
  const { records } = useChart('momentum', ['period', 'undated']);
  const years = useMemo(() => projectsPerYear(records, FROM, THIS_YEAR), [records]);
  const undated = records.filter((r) => !r.year).length;
  // Compare the last complete year with five years before it; the current year is still being filled in.
  const last = years.find((y) => y.year === LAST)!;
  const base = years.find((y) => y.year === LAST - 5)!;
  const shareNow = openShare(records, LAST, LAST);
  const shareThen = openShare(records, LAST - 5, LAST - 5);
  const dated = years.reduce((a, y) => a + y.open + y.proprietary, 0);

  return (
    <ChartCard
      id="momentum"
      ignore={['period', 'undated']}
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
          <YearBars years={years} />
          <CoverageBar known={records.length - undated} unknown={undated} knownLabel="projects with a known year" unknownLabel="with an unknown year, not shown" />
          <p className="mt-3 text-xs text-ink-500">
            {THIS_YEAR} is still in progress.
          </p>
        </>
      )}
    </ChartCard>
  );
}
