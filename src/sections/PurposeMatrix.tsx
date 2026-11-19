import { useMemo, useState } from 'react';
import { useChart } from '../lib/chartFilters';
import { DECISION_INFO, purposeMatrix } from '../lib/insights';
import { Link, slug } from '../lib/router';
import { isOpenSource } from '../lib/tools';
import ChartCard from '../components/chart/ChartCard';
import Segmented from '../components/chart/Segmented';
import EmptyState from '../components/common/EmptyState';
import ToolLogo from '../components/common/ToolLogo';

/** Which tools are used for which grid decision: a heat matrix of projects per tool and purpose. */
export default function PurposeMatrix() {
  const { records } = useChart('purpose');
  const [mode, setMode] = useState('count');
  const m = useMemo(() => purposeMatrix(records), [records]);

  return (
    <ChartCard
      id="purpose"
      title="Which tool for which decision"
      description="Each row is a tool, each column a kind of decision the modelling informed; a cell counts the projects. Read a row for what a tool is used for, a column for the tools behind that decision."
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
                  <th key={d} scope="col" className="w-[10%] px-1 pb-2 align-bottom text-xs font-medium leading-tight text-ink-300" title={DECISION_INFO[d]?.description}>{DECISION_INFO[d]?.short ?? d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.rows.map((row) => (
                <tr key={row.tool}>
                  <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-[#0c0f1b] pr-3 text-left font-normal">
                    <Link href={`/tools/${slug(row.tool)}`} className={`flex items-center gap-2 hover:text-ink-50 ${isOpenSource(row.tool) ? 'text-brand-200' : 'text-ink-200'}`}>
                      <ToolLogo name={row.tool} size={20} />
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
        {mode === 'share' ? 'Percentages add up to 100% per tool. ' : ''}Projects without a stated decision are left out. Open-source tools are named in ember.
      </p>
      <details className="group mt-4 border-t border-ink-800/80 pt-3">
        <summary className="cursor-pointer list-none text-sm text-ink-300 hover:text-ink-50">
          <span className="mr-1.5 inline-block transition-transform group-open:rotate-90">›</span>What the columns mean
        </summary>
        <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {m.decisions.map((d) => (
            <div key={d}>
              <dt className="text-sm text-ink-100">{DECISION_INFO[d]?.short ?? d}</dt>
              <dd className="text-xs leading-relaxed text-ink-400">{DECISION_INFO[d]?.description}</dd>
            </div>
          ))}
        </dl>
      </details>
    </ChartCard>
  );
}
