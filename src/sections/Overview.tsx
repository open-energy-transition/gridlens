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
  const [includeEmpty, setIncludeEmpty] = useState(false);

  const data = useMemo(
    () => countBy(records, 'tool_name', includeEmpty).slice(0, topN),
    [records, includeEmpty, topN]
  );

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
                  max={40}
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="accent-brand-500"
                />
                <span className="w-6 text-ink-200">{topN}</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-400">
                <input
                  type="checkbox"
                  checked={includeEmpty}
                  onChange={(e) => setIncludeEmpty(e.target.checked)}
                  className="accent-brand-500"
                />
                Include empty tool_name
              </label>
            </div>
            {data.length === 0 ? (
              <EmptyState />
            ) : (
              <HorizontalBarChart data={data} height={Math.max(320, data.length * 26)} />
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
