import type { CatalogueRecord } from '../types';

const ALL_COLUMNS: (keyof CatalogueRecord)[] = [
  'country_label',
  'institution_name',
  'official_website',
  'tool_name',
  'tool_category',
  'use_case',
  'evidence_strength',
  'source_type',
  'source_title',
  'source_date',
  'source_link',
  'exact_snippet_or_quote',
  'why_it_supports_the_claim',
  'notes',
  'dataset_origin',
];

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(records: CatalogueRecord[], columns: (keyof CatalogueRecord)[] = ALL_COLUMNS): string {
  const header = columns.join(',');
  const rows = records.map((r) => columns.map((c) => escapeCsvCell(r[c])).join(','));
  return [header, ...rows].join('\n');
}

export function downloadCsv(filename: string, records: CatalogueRecord[], columns?: (keyof CatalogueRecord)[]): void {
  const csv = toCsv(records, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { ALL_COLUMNS };
