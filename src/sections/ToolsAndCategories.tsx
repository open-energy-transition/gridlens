import { useMemo } from 'react';
import type { CatalogueRecord } from '../types';
import { countBy } from '../lib/filters';
import DonutChart from '../components/charts/DonutChart';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';

interface ToolsAndCategoriesProps {
  records: CatalogueRecord[];
}

export default function ToolsAndCategories({ records }: ToolsAndCategoriesProps) {
  const categoryData = useMemo(() => countBy(records, 'tool_category'), [records]);
  const evidenceData = useMemo(() => countBy(records, 'evidence_strength'), [records]);

  return (
    <div>
      <SectionHeader
        title="Tools & Categories"
        description="Distribution of tool categories and the strength of evidence behind each record."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Tool category distribution">
          {categoryData.length === 0 ? <EmptyState /> : <DonutChart data={categoryData} />}
        </Card>
        <Card title="Evidence strength distribution">
          {evidenceData.length === 0 ? <EmptyState /> : <VerticalBarChart data={evidenceData} />}
        </Card>
      </div>
    </div>
  );
}
