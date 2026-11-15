import { useMemo } from 'react';
import type { CatalogueRecord } from '../types';
import { countBy } from '../lib/filters';
import { colorFor } from '../lib/colors';
import { splitCategories, TOOL_CATEGORIES } from '../lib/toolCategories';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';

interface ToolsAndCategoriesProps {
  records: CatalogueRecord[];
}

export default function ToolsAndCategories({ records }: ToolsAndCategoriesProps) {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of records) {
      for (const c of splitCategories(r.tool_category)) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return counts;
  }, [records]);
  const evidenceData = useMemo(() => countBy(records, 'evidence_strength'), [records]);
  const max = Math.max(1, ...categoryCounts.values());

  return (
    <div>
      <SectionHeader
        title="Tools & Categories"
        description="What the models were used for, and the strength of evidence behind each record. A record counts in every category its study covers."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Modelling categories">
          {records.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-5">
              {TOOL_CATEGORIES.map((c, i) => {
                const n = categoryCounts.get(c.id) ?? 0;
                return (
                  <li key={c.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-ink-100">{c.label}</span>
                      <span className="shrink-0 text-sm tabular-nums text-ink-400">{n} records</span>
                    </div>
                    <div className="mb-2 h-2 rounded-full bg-ink-800" aria-hidden="true">
                      <div className="h-2 rounded-full" style={{ width: `${(100 * n) / max}%`, background: colorFor(i) }} />
                    </div>
                    <p className="text-sm leading-relaxed text-ink-400">{c.description}</p>
                    {c.examples && <p className="mt-1 text-xs text-ink-500">Typical tools: {c.examples}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title="Evidence strength distribution">
          {evidenceData.length === 0 ? <EmptyState /> : <VerticalBarChart data={evidenceData} />}
        </Card>
      </div>
    </div>
  );
}
