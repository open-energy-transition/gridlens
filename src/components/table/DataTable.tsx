import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import type { CatalogueRecord } from '../../types';
import { safe } from '../../lib/filters';
import EmptyState from '../common/EmptyState';

const COLUMN_LABELS: Record<keyof CatalogueRecord, string> = {
  country_label: 'Country',
  institution_name: 'Institution',
  official_website: 'Website',
  tool_name: 'Tool',
  tool_category: 'Category',
  use_case: 'Use case',
  evidence_strength: 'Evidence',
  source_type: 'Source type',
  source_title: 'Source title',
  source_date: 'Source date',
  source_link: 'Source link',
  exact_snippet_or_quote: 'Quote',
  why_it_supports_the_claim: 'Justification',
  notes: 'Notes',
  dataset_origin: 'Dataset origin',
};

const DEFAULT_COLUMNS: (keyof CatalogueRecord)[] = [
  'country_label',
  'institution_name',
  'tool_name',
  'tool_category',
  'evidence_strength',
  'source_link',
];

const ALL_COLUMN_KEYS = Object.keys(COLUMN_LABELS) as (keyof CatalogueRecord)[];

const PAGE_SIZE = 20;

interface DataTableProps {
  records: CatalogueRecord[];
}

function normalizeLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function DataTable({ records }: DataTableProps) {
  const [columns, setColumns] = useState<(keyof CatalogueRecord)[]>(DEFAULT_COLUMNS);
  const [sortKey, setSortKey] = useState<keyof CatalogueRecord>('tool_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      const av = safe(a[sortKey]).toLowerCase();
      const bv = safe(b[sortKey]).toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [records, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: keyof CatalogueRecord) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  function toggleColumn(key: keyof CatalogueRecord) {
    setColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  }

  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {ALL_COLUMN_KEYS.map((key) => {
          const active = columns.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleColumn(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                  : 'border-ink-800 text-ink-500 hover:text-ink-300'
              }`}
            >
              {COLUMN_LABELS[key]}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-800">
        <table className="min-w-full divide-y divide-ink-800 text-sm">
          <thead className="bg-ink-900/80">
            <tr>
              {columns.map((key) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-400 hover:text-ink-200"
                >
                  <span className="inline-flex items-center gap-1">
                    {COLUMN_LABELS[key]}
                    {sortKey === key ? (
                      sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/60">
            {pageRows.map((r, i) => (
              <tr key={`${r.institution_name}-${r.tool_name}-${clampedPage}-${i}`} className="hover:bg-ink-900/50">
                {columns.map((key) => {
                  if (key === 'source_link') {
                    const link = normalizeLink(safe(r.source_link));
                    return (
                      <td key={key} className="whitespace-nowrap px-4 py-2.5">
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                          >
                            Link <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-ink-600">—</span>
                        )}
                      </td>
                    );
                  }
                  const value = safe(r[key]);
                  return (
                    <td key={key} className="max-w-xs truncate px-4 py-2.5 text-ink-300" title={value}>
                      {value || <span className="text-ink-600">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          Page {clampedPage + 1} of {pageCount} &middot; {sorted.length} records
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={clampedPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-ink-800 px-3 py-1.5 font-medium text-ink-300 disabled:opacity-30"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={clampedPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-lg border border-ink-800 px-3 py-1.5 font-medium text-ink-300 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
