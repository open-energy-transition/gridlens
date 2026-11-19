import { useMemo, useState } from 'react';
import { safe } from '../lib/filters';
import { toAtlasName } from '../lib/countryAliases';
import WorldMap from '../components/charts/WorldMap';
import MapLegend from '../components/charts/MapLegend';
import { Segmented } from '../components/common/AdoptionRanking';
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
      if (!country) continue;
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
      actions={
        <Segmented
          label="Metric"
          value={metric}
          onChange={(v) => setMetric(v as Metric)}
          options={[{ id: 'records', label: 'Total projects' }, { id: 'tools', label: 'Unique tools' }]}
        />
      }
    >
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1">
          <WorldMap valueByCountry={mapValueByAtlasName} maxValue={maxValue} />
        </div>
        <MapLegend maxValue={maxValue} unitLabel={metric === 'records' ? 'Records' : 'Unique tools'} />
      </div>

      {multiCountryCount > 0 && (
        <p className="mt-2 text-xs text-ink-500">
          Plus {multiCountryCount} multi-country and {globalCount} global projects.
        </p>
      )}

      <div className="mt-4 rounded-lg border border-ink-800 bg-ink-950/40 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-ink-100">Top 15 countries</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-lg border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm"
            >
              <span className="truncate text-ink-300" title={row.name}>
                {row.name}
              </span>
              <span className="font-semibold text-brand-400">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
