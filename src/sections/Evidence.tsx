import { useMemo } from 'react';
import { countBy } from '../lib/filters';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import ChartCard from '../components/chart/ChartCard';
import EmptyState from '../components/common/EmptyState';
import { useChart } from '../lib/chartFilters';

/** Evidence strength. */
export default function Evidence() {
  const { records } = useChart('evidence');
  const evidenceData = useMemo(() => countBy(records, 'evidence_strength'), [records]);

  return (
    <ChartCard
      id="evidence"
      title="Evidence strength"
    >
      {evidenceData.length === 0 ? <EmptyState /> : <VerticalBarChart data={evidenceData} />}
    </ChartCard>
  );
}
