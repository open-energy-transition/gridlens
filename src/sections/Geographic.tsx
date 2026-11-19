import { useMemo, useState } from 'react';
import { safe } from '../lib/filters';
import { toAtlasName } from '../lib/countryAliases';
import WorldMap from '../components/charts/WorldMap';
import MapLegend from '../components/charts/MapLegend';
import Segmented from '../components/chart/Segmented';
import ChartCard from '../components/chart/ChartCard';
import { useChart } from '../lib/chartFilters';

type Metric = 'records' | 'tools';

/** Where the tools are used. */
export default function Geographic() {
  const { records } = useChart('map');
  const [metric, setMetric] = useState<Metric>('records');

  const { mapValueByAtlasName, maxValue, rows, multiCountryCount, globalCount } = useMemo(() => {
    const recordCounts = new Map<string, number>();
    const toolSets = new Map<string, Set<string>>();
    const atlasRecordCounts = new Map<string, number>();
    const atlasToolSets = new Map<string, Set<string>>();
    let mcCount = 0;
    let gCount = 0;
    for (const r of records) {
      const country = safe(r.country_label);
      if (!country || r.geo_scope !== 'national') continue;
      recordCounts.set(country, (recordCounts.get(country) ?? 0) + 1);
      const tool = safe(r.tool_name);
      if (tool) {
        if (!toolSets.has(country)) toolSets.set(country, new Set());
        toolSets.get(country)!.add(tool);
      }

      const atlasName = toAtlasName(country);
      atlasRecordCounts.set(atlasName, (atlasRecordCounts.get(atlasName) ?? 0) + 1);
      if (tool) {
        if (!atlasToolSets.has(atlasName)) atlasToolSets.set(atlasName, new Set());
        atlasToolSets.get(atlasName)!.add(tool);
      }
    }
    const source = metric === 'records' ? recordCounts : new Map(Array.from(toolSets, ([k, v]) => [k, v.size]));
    const atlasSource =
      metric === 'records' ? atlasRecordCounts : new Map(Array.from(atlasToolSets, ([k, v]) => [k, v.size]));
    let max = 0;
    for (const v of atlasSource.values()) max = Math.max(max, v);
    const rowList = Array.from(source.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    for (const r of records) {
      if (r.geo_scope === 'multi_country') mcCount += 1;
      else if (r.geo_scope === 'global') gCount += 1;
    }

    return { valueByCountry: source, mapValueByAtlasName: atlasSource, maxValue: max, rows: rowList, multiCountryCount: mcCount, globalCount: gCount };
  }, [records, metric]);

  return (
    <ChartCard
      id="map"
      title="Where the tools are used"
      description="Projects per country. Regional and global studies are counted separately below the map."
      actions={
        <Segmented
          label="Metric"
          value={metric}
          onChange={(v) => setMetric(v as Metric)}
          options={[{ id: 'records', label: 'Projects' }, { id: 'tools', label: 'Distinct tools' }]}
        />
      }
    >
      <div className="flex flex-col lg:flex-row lg:gap-4">
        <div className="min-w-0 flex-1">
          <WorldMap valueByCountry={mapValueByAtlasName} maxValue={maxValue} unit={metric === 'records' ? 'projects' : 'tools'} />
        </div>
        <MapLegend maxValue={maxValue} unitLabel={metric === 'records' ? 'Projects' : 'Tools'} />
      </div>
      {multiCountryCount + globalCount > 0 && (
        <p className="mt-3 text-xs text-ink-500">Plus {multiCountryCount} multi-country and {globalCount} global projects.</p>
      )}
      <h3 className="mb-3 mt-6 text-xs uppercase tracking-[0.14em] text-ink-500">Top countries</h3>
      <ol className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row, i) => (
          <li key={row.name} className="flex items-baseline justify-between gap-3 border-b border-ink-800/70 py-2 text-sm">
            <span className="flex min-w-0 gap-3"><span className="tabular w-5 shrink-0 text-xs text-ink-600">{i + 1}</span><span className="truncate text-ink-200" title={row.name}>{row.name}</span></span>
            <span className="tabular text-ink-300">{row.count}</span>
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}
