import type { CatalogueRecord } from '../types';

const ALL_COLUMNS: (keyof CatalogueRecord)[] = [
  'project_title',
  'organizations',
  'countries',
  'geo_scope',
  'country_label',
  'institution_name',
  'institution_category',
  'role',
  'official_website',
  'tool_name',
  'tool_category',
  'use_case',
  'summary',
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

/** Lists become "a; b"; organizations "Name (role)"; sources their link. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (!Array.isArray(value)) return String(value);
  return value
    .map((v) => (typeof v !== 'object' ? String(v) : 'name' in v ? `${v.name} (${v.role})` : String(v.link ?? '')))
    .join('; ');
}

function escapeCsvCell(value: unknown): string {
  const str = cellText(value);
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
