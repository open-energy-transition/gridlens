import { Download } from 'lucide-react';
import type { CatalogueRecord } from '../types';
import { downloadCsv } from '../lib/csv';
import DataTable from '../components/table/DataTable';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';

interface RecordsExportProps {
  records: CatalogueRecord[];
}

export default function RecordsExport({ records }: RecordsExportProps) {
  return (
    <div>
      <SectionHeader
        title="Records & Export"
        description="Browse, sort and export the currently filtered records."
      />
      <Card>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => downloadCsv('catalogue_filtered.csv', records)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400"
          >
            <Download size={16} />
            Download filtered CSV
          </button>
        </div>
        <DataTable records={records} />
      </Card>
    </div>
  );
}
