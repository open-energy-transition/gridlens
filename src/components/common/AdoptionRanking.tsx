import { useMemo, useState } from 'react';
import type { CatalogueRecord } from '../../types';
import { adoptionByTool } from '../../lib/filters';
import { SECTORS } from '../../lib/orgTypes';
import { isOpenSource } from '../../lib/tools';
import HorizontalBarChart from '../charts/HorizontalBarChart';
import LicenseBadge from './LicenseBadge';
import Card from './Card';
import EmptyState from './EmptyState';

const OPEN = '#34d399'; // emerald-400
const PROPRIETARY = '#7c8aa5';

function Segmented({ value, options, onChange, label }: {
  value: string; options: { id: string; label: string }[]; onChange: (v: string) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-ink-800 bg-ink-900 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-2.5 py-1 font-medium ${value === o.id ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Tools ranked by how many organizations use them, by sector, with open-source tools in their own colour.
 * The sector and licence switches only change this chart; the filters above still apply.
 */
export default function AdoptionRanking({ records, sector: initialSector = 'All' }: { records: CatalogueRecord[]; sector?: string }) {
  const [sector, setSector] = useState(initialSector);
  const [license, setLicense] = useState('All');
  const data = useMemo(
    () => adoptionByTool(records, sector).filter((d) =>
      license === 'All' || (license === 'open_source') === isOpenSource(d.name)),
    [records, sector, license],
  );
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink-100">Most adopted tools</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Organizations using each tool in the current selection; an organization counts once per tool.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented label="Sector" value={sector} onChange={setSector}
            options={[{ id: 'All', label: 'All sectors' }, ...SECTORS.map((s) => ({ id: s.id, label: s.label }))]} />
          <Segmented label="Licence" value={license} onChange={setLicense}
            options={[{ id: 'All', label: 'All' }, { id: 'open_source', label: 'Open source' }, { id: 'proprietary', label: 'Proprietary' }]} />
        </div>
      </div>
      <div className="mb-3 flex gap-4 text-xs text-ink-400" aria-hidden="true">
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full" style={{ background: OPEN }} />Open source</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full" style={{ background: PROPRIETARY }} />Proprietary</span>
      </div>
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <HorizontalBarChart data={data} colorOf={(n) => (isOpenSource(n) ? OPEN : PROPRIETARY)} badge={(n) => <LicenseBadge tool={n} />} />
      )}
    </Card>
  );
}
