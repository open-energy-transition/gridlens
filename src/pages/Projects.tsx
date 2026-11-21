import { Download } from 'lucide-react';
import { downloadCsv } from '../lib/csv';
import { useChart } from '../lib/chartFilters';
import DataTable from '../components/table/DataTable';
import ChartCard from '../components/chart/ChartCard';

/** Every project with its organizations and sources, filterable and downloadable. */
export default function Projects() {
  const { records } = useChart('projects');
  return (
    <div className="pt-10 md:pt-14">
      <h1 className="font-display text-5xl text-ink-50">Projects &amp; data</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-300">
        Every project with its organizations, countries and sources. Filter, sort and download what you see as CSV; the data is
        free to reuse with attribution.
      </p>
      <div className="mt-8">
        <ChartCard
          id="projects"
          years
          title={`${records.length.toLocaleString('en')} projects`}
          actions={
            <button type="button" onClick={() => downloadCsv('gridlens_projects.csv', records)} aria-label="Download these projects as CSV"
              className="flex h-9 items-center gap-1.5 rounded-full bg-ink-50 px-3.5 text-xs font-medium text-ink-950 hover:bg-white">
              <Download size={14} /> CSV
            </button>
          }
        >
          <DataTable records={records} />
        </ChartCard>
      </div>
    </div>
  );
}
