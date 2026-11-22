import { useMemo } from 'react';
import { adoptionByTool } from '../../lib/filters';
import { useChart } from '../../lib/chartFilters';
import { SECTORS } from '../../lib/orgTypes';
import { isOpenSource } from '../../lib/tools';
import { OPEN_SOURCE, PROPRIETARY } from '../../lib/colors';
import { slug } from '../../lib/router';
import HorizontalBarChart from '../charts/HorizontalBarChart';
import ChartCard from '../chart/ChartCard';
import Segmented from '../chart/Segmented';
import EmptyState from './EmptyState';
import ToolLogo from './ToolLogo';

export function LicenceLegend() {
  return (
    <div className="flex gap-4 text-xs text-ink-400">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: OPEN_SOURCE }} />Open source</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: PROPRIETARY }} />Proprietary</span>
    </div>
  );
}

/** Tools ranked by how many organizations use them; sector and licence are quick switches for this chart's filters. */
export default function AdoptionRanking() {
  const { filters, setFilters, records } = useChart('adoption');
  const data = useMemo(() => adoptionByTool(records, filters.sector), [records, filters.sector]);
  return (
    <ChartCard
      id="adoption"
      data={() => data.map((d) => ({ tool: d.name, licence: isOpenSource(d.name) ? 'open source' : 'proprietary', organizations: d.count }))}
      years
      title="Most adopted tools"
      description="Organizations per tool, each counted once."
      actions={
        <>
          <Segmented label="Sector" value={filters.sector} onChange={(v) => setFilters({ ...filters, sector: v })}
            options={[{ id: 'All', label: 'All' }, ...SECTORS.map((s) => ({ id: s.id, label: s.id === 'industry' ? 'Industry' : 'Academia' }))]} />
          <Segmented label="Licence" value={filters.license} onChange={(v) => setFilters({ ...filters, license: v })}
            options={[{ id: 'All', label: 'All' }, { id: 'open_source', label: 'Open' }, { id: 'proprietary', label: 'Proprietary' }]} />
        </>
      }
    >
      <div className="mb-4"><LicenceLegend /></div>
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <HorizontalBarChart ranked data={data} unit="organizations" icon={(n) => <ToolLogo name={n} size={20} />} hrefOf={(n) => `/tools/${slug(n)}`}
          colorOf={(n) => (isOpenSource(n) ? OPEN_SOURCE : PROPRIETARY)} />
      )}
    </ChartCard>
  );
}
