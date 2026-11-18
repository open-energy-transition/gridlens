import { useMemo } from 'react';
import { Building2, Globe2, FileStack, Download } from 'lucide-react';
import type { CatalogueRecord } from '../types';
import { countBy, countByOrganization, safe, uniqueCount, uniqSorted } from '../lib/filters';
import { downloadCsv } from '../lib/csv';
import KpiCard from '../components/kpi/KpiCard';
import LicenseBadge from '../components/common/LicenseBadge';
import { toolInfo } from '../lib/tools';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import DataTable from '../components/table/DataTable';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';

interface TopUsersByToolProps {
  allRecords: CatalogueRecord[];
  tool?: string;
  onToolChange?: (selectedTool: string) => void;
}

export default function TopUsersByTool({ allRecords, tool: routeTool, onToolChange }: TopUsersByToolProps) {
  const tools = useMemo(() => uniqSorted(allRecords, 'tool_name'), [allRecords]);
  // The selected tool lives in the URL (/top-users/<tool>), so back/forward and shared links work.
  const tool = routeTool
    ? (tools.find(t => t.toLowerCase() === routeTool.toLowerCase()) ?? tools[0] ?? '')
    : (tools.includes('PLEXOS') ? 'PLEXOS' : tools[0] ?? '');

  function handleToolChange(selectedTool: string) {
    onToolChange?.(selectedTool);
  }

  const toolRecords = useMemo(
    () => allRecords.filter((r) => safe(r.tool_name) === tool),
    [allRecords, tool]
  );

  const institutionData = useMemo(() => countByOrganization(toolRecords).slice(0, 15), [toolRecords]);
  const countryData = useMemo(() => countBy(toolRecords, 'country_label').slice(0, 15), [toolRecords]);
  const evidenceData = useMemo(() => countBy(toolRecords, 'evidence_strength'), [toolRecords]);

  return (
    <div>
      <SectionHeader
        title="Top Users by Tool"
        description="Independent of the sidebar filters — pick a tool to see its own usage breakdown."
      />

      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Tool</span>
        <select
          value={tool}
          onChange={(e) => handleToolChange(e.target.value)}
          className="rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-ink-200 outline-none focus:border-brand-500"
        >
          {tools.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
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

      {toolRecords.length === 0 ? (
        <EmptyState title={`No projects for ${tool}`} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard icon={FileStack} label="Projects" value={toolRecords.length} />
            <KpiCard icon={Building2} label="Institutions" value={uniqueCount(toolRecords, 'institution_name')} />
            <KpiCard icon={Globe2} label="Countries" value={uniqueCount(toolRecords, 'country_label')} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title={`Top institutions using ${tool}`}>
              <HorizontalBarChart data={institutionData} colorIndex={1} />
            </Card>
            <Card title={`Top countries using ${tool}`}>
              <HorizontalBarChart data={countryData} colorIndex={2} />
            </Card>
          </div>

          <Card title="Evidence strength breakdown" className="mt-6">
            <VerticalBarChart data={evidenceData} />
          </Card>

          <Card className="mt-6" title={`All ${tool} projects`}>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => downloadCsv(`${tool.replace(/\s+/g, '_')}_projects.csv`, toolRecords)}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400"
              >
                <Download size={16} />
                Download {tool} CSV
              </button>
            </div>
            <DataTable records={toolRecords} />
          </Card>
        </>
      )}
    </div>
  );
}
