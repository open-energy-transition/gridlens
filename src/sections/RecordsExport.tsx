import { Download } from 'lucide-react';
import { downloadCsv } from '../lib/csv';
import DataTable from '../components/table/DataTable';
import ChartCard from '../components/chart/ChartCard';
import { useChart } from '../lib/chartFilters';

/** All projects. */
export default function RecordsExport() {
  const { records } = useChart('projects');

  return (
    <ChartCard
      id="projects"
      title="All projects"
      actions={
        <button
          type="button"
          onClick={() => downloadCsv('catalogue_filtered.csv', records)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-ink-800 px-2.5 text-xs font-medium text-ink-300 hover:border-ink-700 hover:text-ink-100"
          aria-label="Download filtered CSV"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Download CSV</span>
        </button>
      }
    >
      <DataTable records={records} />
    </ChartCard>
  );
}
