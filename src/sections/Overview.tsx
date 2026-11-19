import { useMemo } from 'react';
import type { CatalogueRecord, Section } from '../types';
import { splitCategories, TOOL_CATEGORIES } from '../lib/toolCategories';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import LicenseBadge from '../components/common/LicenseBadge';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Changelog from '../components/common/Changelog';
import AdoptionRanking from '../components/common/AdoptionRanking';

interface OverviewProps {
  records: CatalogueRecord[];
  onNavigate?: (section: Section) => void;
  /** Sector selected in the filters; the adoption chart starts there. */
  sector?: string;
}

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

export default function Overview({ records, onNavigate, sector = 'All' }: OverviewProps) {
  const groups = useMemo(() => toolsByCategory(records), [records]);

  return (
    <div>
      <SectionHeader
        title="Overview"
        description="Evidence per modelling domain: how many records show each tool in use, in the current selection."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:col-span-2">
          <div className="md:col-span-2">
            <AdoptionRanking key={sector} records={records} sector={sector} />
          </div>
          {groups.length === 0 ? (
            <EmptyState />
          ) : (
            groups.map((g) => (
              <Card key={g.category.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold text-ink-100">{g.category.label}</h3>
                  <span className="shrink-0 text-sm tabular-nums text-ink-400">{g.total} projects</span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-ink-500">{g.category.description}</p>
                <HorizontalBarChart data={g.tools} colorIndex={g.colorIndex} badge={(name) => <LicenseBadge tool={name} />} />
              </Card>
            ))
          )}
        </div>
        <div>
          <Changelog limit={5} onSeeMore={() => onNavigate?.('changelog')} />
        </div>
      </div>
    </div>
  );
}
