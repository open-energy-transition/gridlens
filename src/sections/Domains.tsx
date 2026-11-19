import { useMemo } from 'react';
import type { CatalogueRecord } from '../types';
import { splitCategories, TOOL_CATEGORIES } from '../lib/toolCategories';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import ChartCard from '../components/chart/ChartCard';
import LicenseBadge from '../components/common/LicenseBadge';
import EmptyState from '../components/common/EmptyState';
import { useChart } from '../lib/chartFilters';

/** Records per tool within each modelling category (a record counts in every category it covers). */
function toolsByCategory(records: CatalogueRecord[]) {
  return TOOL_CATEGORIES.map((c, i) => {
    const counts = new Map<string, number>();
    let total = 0;
    for (const r of records) {
      if (!splitCategories(r.tool_category).includes(c.id)) continue;
      total += 1;
      counts.set(r.tool_name, (counts.get(r.tool_name) ?? 0) + 1);
    }
    const tools = [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    return { category: c, colorIndex: i, total, tools };
  }).filter((g) => g.total > 0);
}

/** Tools by modelling domain. */
export default function Domains() {
  const { records } = useChart('domains');
  const groups = useMemo(() => toolsByCategory(records), [records]);

  return (
    <ChartCard
      id="domains"
      title="Tools by modelling domain"
    >
      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.category.id} className="rounded-lg border border-ink-800 bg-ink-950/40 p-4">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h3 className="font-display text-sm font-semibold text-ink-100">{g.category.label}</h3>
                <span className="shrink-0 text-sm tabular-nums text-ink-400">{g.total} projects</span>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-ink-500">{g.category.description}</p>
              <HorizontalBarChart data={g.tools} colorIndex={g.colorIndex} badge={(name) => <LicenseBadge tool={name} />} />
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
