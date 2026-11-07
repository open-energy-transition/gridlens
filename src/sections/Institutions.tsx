import { useMemo } from 'react';
import type { CatalogueRecord } from '../types';
import { countBy } from '../lib/filters';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';

interface InstitutionsProps {
  records: CatalogueRecord[];
}

export default function Institutions({ records }: InstitutionsProps) {
  const data = useMemo(() => countBy(records, 'institution_name').slice(0, 25), [records]);

  return (
    <div>
      <SectionHeader
        title="Institutions"
        description="The top 25 institutions by number of catalogued records in the current selection."
      />
      <Card title="Top 25 institutions">
        {data.length === 0 ? <EmptyState /> : <HorizontalBarChart data={data} height={Math.max(420, data.length * 24)} />}
      </Card>
    </div>
  );
}
