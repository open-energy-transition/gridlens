import { useMemo } from 'react';
import { Building2, Globe2, FileStack } from 'lucide-react';
import { countBy, countByOrganization, safe, uniqueCount } from '../lib/filters';
import KpiCard from '../components/kpi/KpiCard';
import LicenseBadge from '../components/common/LicenseBadge';
import { toolInfo } from '../lib/tools';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import ChartCard, { ALL_FIELDS } from '../components/chart/ChartCard';
import EmptyState from '../components/common/EmptyState';
import { useChart } from '../lib/chartFilters';

/** Top users by tool. */
export default function TopUsersByTool() {
  const { filters, setFilters, records, options } = useChart('top-users');
  const allToolNames = options.toolNames;

  // Default to 'PLEXOS' when it is 'All'
  const defaultTool = allToolNames.includes('PLEXOS') ? 'PLEXOS' : (allToolNames[0] ?? '');
  const tool = filters.toolName === 'All' ? defaultTool : filters.toolName;

  const toolRecords = useMemo(
    () => records.filter((r) => safe(r.tool_name) === tool),
    [records, tool]
  );

  const institutionData = useMemo(() => countByOrganization(toolRecords).slice(0, 15), [toolRecords]);
  const countryData = useMemo(() => countBy(toolRecords, 'country_label').slice(0, 15), [toolRecords]);
  const evidenceData = useMemo(() => countBy(toolRecords, 'evidence_strength'), [toolRecords]);

  return (
    <ChartCard
      id="top-users"
      title="Top users by tool"
      description="Who uses one tool most, where, and with what evidence."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tool}
            onChange={(e) => setFilters({ ...filters, toolName: e.target.value })}
            className="h-9 rounded-lg border border-ink-800 bg-ink-900 px-2.5 py-0 text-sm text-ink-200 outline-none focus:border-brand-500"
          >
            {allToolNames.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <LicenseBadge tool={tool} />
          {toolInfo(tool) && (
            <a href={toolInfo(tool)!.url} target="_blank" rel="noreferrer" className="text-xs text-ink-500 hover:text-ink-300">
              {toolInfo(tool)!.vendor}
              {toolInfo(tool)!.licenseName ? ` · ${toolInfo(tool)!.licenseName}` : ''}
            </a>
          )}
        </div>
      }
      fields={ALL_FIELDS.filter((f) => f !== 'toolName')}
    >
      {toolRecords.length === 0 ? (
        <EmptyState title={`No projects for ${tool}`} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard icon={FileStack} label="Projects" value={toolRecords.length} />
            <KpiCard icon={Building2} label="Institutions" value={uniqueCount(toolRecords, 'institution_name')} />
            <KpiCard icon={Globe2} label="Countries" value={uniqueCount(toolRecords, 'country_label')} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-ink-800 bg-ink-950/40 p-4">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink-100">Top institutions using {tool}</h3>
              <HorizontalBarChart data={institutionData} colorIndex={1} />
            </div>
            <div className="rounded-lg border border-ink-800 bg-ink-950/40 p-4">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink-100">Top countries using {tool}</h3>
              <HorizontalBarChart data={countryData} colorIndex={2} />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-ink-800 bg-ink-950/40 p-4">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink-100">Evidence strength breakdown</h3>
            <VerticalBarChart data={evidenceData} />
          </div>
        </>
      )}
    </ChartCard>
  );
}
