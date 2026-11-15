import { useMemo, useState } from 'react';
import type { CatalogueRecord, Section } from '../types';
import { countBy } from '../lib/filters';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Changelog from '../components/common/Changelog';

interface OverviewProps {
  records: CatalogueRecord[];
  onNavigate?: (section: Section) => void;
}

export default function Overview({ records, onNavigate }: OverviewProps) {
  const [topN, setTopN] = useState(20);

  const allTools = useMemo(() => countBy(records, 'tool_name'), [records]);
  const maxN = Math.max(5, allTools.length);
  const shown = Math.min(topN, maxN);
  const data = allTools.slice(0, shown);

  return (
    <div>
      <SectionHeader
        title="Overview"
        description="Tool usage across the current filtered selection, ranked by record count."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Top tools by record count">
            <div className="mb-4 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm text-ink-400">
                Top N
                <input
                  type="range"
                  min={5}
                  max={maxN}
                  value={shown}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="accent-brand-500"
                />
                <span className="w-6 text-ink-200">{shown}</span>
              </label>
            </div>
            {data.length === 0 ? (
              <EmptyState />
            ) : (
              <HorizontalBarChart data={data} />
            )}
          </Card>
        </div>
        <div>
          <Changelog limit={5} onSeeMore={() => onNavigate?.('changelog')} />
        </div>
      </div>
    </div>
  );
}
