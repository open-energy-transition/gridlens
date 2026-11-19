import { useMemo } from 'react';
import { countByOrganization } from '../lib/filters';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import ChartCard from '../components/chart/ChartCard';
import EmptyState from '../components/common/EmptyState';
import { useChart } from '../lib/chartFilters';

/** Top 25 institutions. */
export default function Institutions() {
  const { records } = useChart('institutions');
  const data = useMemo(() => countByOrganization(records).slice(0, 25), [records]);

  return (
    <ChartCard
      id="institutions"
      title="Top 25 institutions"
    >
      {data.length === 0 ? <EmptyState /> : <HorizontalBarChart data={data} />}
    </ChartCard>
  );
}
