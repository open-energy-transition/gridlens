import { useMemo, useState } from 'react';
import type { CatalogueRecord } from '../types';
import { safe } from '../lib/filters';
import { toAtlasName } from '../lib/countryAliases';
import WorldMap from '../components/charts/WorldMap';
import MapLegend from '../components/charts/MapLegend';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';

interface GeographicProps {
  records: CatalogueRecord[];
}

type Metric = 'records' | 'tools';

export default function Geographic({ records }: GeographicProps) {
  const [metric, setMetric] = useState<Metric>('records');

  const { mapValueByAtlasName, maxValue, rows } = useMemo(() => {
    const recordCounts = new Map<string, number>();
    const toolSets = new Map<string, Set<string>>();
    // Separate aggregation keyed by the map atlas's own country names, so
    // e.g. "United States" -> "United States of America" and the two
    // dataset spellings "Turkey" / "Türkiye" both land on the same polygon.
    // The raw country_label aggregation above is still used for the
    // Top-15 list and tooltip, so display text never changes.
    const atlasRecordCounts = new Map<string, number>();
    const atlasToolSets = new Map<string, Set<string>>();
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
    return { valueByCountry: source, mapValueByAtlasName: atlasSource, maxValue: max, rows: rowList };
  }, [records, metric]);

  return (
    <div>
      <SectionHeader
        title="Geographic Analysis"
        description="Where catalogued institutions and tools are located, by country."
      />
      <Card noPadding className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-800 px-5 py-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Metric</span>
          <div className="flex overflow-hidden rounded-lg border border-ink-800">
            {(['records', 'tools'] as Metric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  metric === m ? 'bg-brand-500/20 text-brand-300' : 'text-ink-400 hover:bg-ink-900'
                }`}
              >
                {m === 'records' ? 'Total Records' : 'Unique Tools'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row">
          <div className="min-w-0 flex-1">
            <WorldMap valueByCountry={mapValueByAtlasName} maxValue={maxValue} />
          </div>
          <MapLegend maxValue={maxValue} unitLabel={metric === 'records' ? 'Records' : 'Unique tools'} />
        </div>
      </Card>

      <Card title="Top 15 countries" className="mt-6">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-sm"
            >
              <span className="truncate text-ink-300" title={row.name}>
                {row.name}
              </span>
              <span className="font-semibold text-brand-400">{row.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
