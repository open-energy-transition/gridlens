import { useMemo, useState } from 'react';
import { useChart } from '../lib/chartFilters';
import { purposeMatrix } from '../lib/insights';
import { Link, slug } from '../lib/router';
import { isOpenSource } from '../lib/tools';
import ChartCard from '../components/chart/ChartCard';
import Segmented from '../components/chart/Segmented';
import EmptyState from '../components/common/EmptyState';

/** Column headers short enough for a matrix. */
const SHORT: Record<string, string> = {
  'Capacity & Resource Planning': 'Capacity planning',
  'Transmission & Network Planning': 'Transmission',
  'Market Operations & Price Formation': 'Markets & prices',
  'Unit Commitment & Dispatch': 'Dispatch',
  'Renewable Integration & Decarbonization': 'Renewables & decarbonization',
  'Policy & Regulatory Analysis': 'Policy & regulation',
  'Forecasting & Scenario Analysis': 'Forecasts & scenarios',
  'Independent & Commissioned Studies': 'Commissioned studies',
  'Academic & Research Studies': 'Research',
  'Other / General Modeling': 'General',
};

/** Which tools are used for which grid decision: a heat matrix of projects per tool and purpose. */
export default function PurposeMatrix() {
  const { records } = useChart('purpose');
  const [mode, setMode] = useState('count');
  const m = useMemo(() => purposeMatrix(records), [records]);

  return (
    <ChartCard
      id="purpose"
      title="Which tool for which decision"
      description="Projects per tool and grid decision. Read across a row for what a tool is used for, down a column for the tools behind one kind of decision."
      fields={['country', 'period', 'sector', 'license', 'orgType', 'evidenceStrength', 'search']}
      actions={<Segmented label="Show" value={mode} onChange={setMode} options={[{ id: 'count', label: 'Projects' }, { id: 'share', label: '% of tool' }]} />}
    >
      {m.rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] border-separate border-spacing-[3px] text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#0c0f1b] pb-2 text-left align-bottom text-xs font-normal text-ink-500">Tool</th>
                {m.decisions.map((d) => (
                  <th key={d} scope="col" className="w-[9%] pb-2 align-bottom text-xs font-normal leading-tight text-ink-400" title={d}>{SHORT[d] ?? d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.rows.map((row) => (
                <tr key={row.tool}>
                  <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-[#0c0f1b] pr-3 text-left font-normal">
                    <Link href={`/tools/${slug(row.tool)}`} className="text-ink-200 hover:text-ink-50">
                      <span className={`mr-2 inline-block h-2 w-2 rounded-sm ${isOpenSource(row.tool) ? 'bg-brand-500' : 'bg-[#7d86a8]'}`} aria-hidden="true" />
                      {row.tool}
                    </Link>
                  </th>
                  {row.counts.map((c, j) => {
                    const share = row.total ? c / row.total : 0;
                    const strength = mode === 'share' ? share : Math.sqrt(c / m.max);
                    const label = mode === 'share' ? (c ? `${Math.round(share * 100)}%` : '') : c || '';
                    return (
                      <td key={j} title={`${row.tool} · ${m.decisions[j]}: ${c} projects (${Math.round(share * 100)}% of ${row.tool})`}
                        className="tabular h-9 rounded-[3px] text-center text-xs"
                        style={{
                          background: c ? `rgba(242, 112, 63, ${0.1 + 0.8 * strength})` : 'rgba(31, 34, 52, 0.5)',
                          color: strength > 0.45 ? '#080a13' : '#cdcad3',
                        }}>
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-500">
        <span className="sm:hidden">Swipe the table sideways for more decisions. </span>
        Projects without a stated decision are left out. Tools marked in ember are open source.
      </p>
    </ChartCard>
  );
}
