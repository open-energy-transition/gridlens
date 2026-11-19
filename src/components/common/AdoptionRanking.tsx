import { useMemo } from 'react';
import { adoptionByTool } from '../../lib/filters';
import { useChart } from '../../lib/chartFilters';
import { SECTORS } from '../../lib/orgTypes';
import { isOpenSource } from '../../lib/tools';
import HorizontalBarChart from '../charts/HorizontalBarChart';
import ChartCard from '../chart/ChartCard';
import LicenseBadge from './LicenseBadge';
import EmptyState from './EmptyState';

const OPEN = '#34d399'; // emerald-400
const PROPRIETARY = '#7c8aa5';

export function Segmented({ value, options, onChange, label }: {
  value: string; options: { id: string; label: string }[]; onChange: (v: string) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-9 items-center rounded-lg border border-ink-800 bg-ink-900 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-full rounded-md px-2.5 font-medium ${value === o.id ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Tools ranked by how many organizations use them, with open-source tools in their own colour.
 * Sector and licence are quick switches for this chart's own filters.
 */
export default function AdoptionRanking() {
  const { filters, setFilters, records } = useChart('adoption');
  const data = useMemo(() => adoptionByTool(records, filters.sector), [records, filters.sector]);
  return (
    <ChartCard
      id="adoption"
      title="Most adopted tools"
      description="Organizations using each tool; an organization counts once per tool."
      actions={
        <>
          <Segmented label="Sector" value={filters.sector} onChange={(v) => setFilters({ ...filters, sector: v })}
            options={[{ id: 'All', label: 'All' }, ...SECTORS.map((s) => ({ id: s.id, label: s.id === 'industry' ? 'Industry' : 'Academia' }))]} />
          <Segmented label="Licence" value={filters.license} onChange={(v) => setFilters({ ...filters, license: v })}
            options={[{ id: 'All', label: 'All' }, { id: 'open_source', label: 'Open' }, { id: 'proprietary', label: 'Proprietary' }]} />
        </>
      }
    >
      <div className="mb-3 flex gap-4 text-xs text-ink-400" aria-hidden="true">
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full" style={{ background: OPEN }} />Open source</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full" style={{ background: PROPRIETARY }} />Proprietary</span>
      </div>
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <HorizontalBarChart data={data} colorOf={(n) => (isOpenSource(n) ? OPEN : PROPRIETARY)} badge={(n) => <LicenseBadge tool={n} />} />
      )}
    </ChartCard>
  );
}
