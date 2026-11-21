import type { CatalogueRecord } from '../types';
import { decisionOf } from './insights';
import { projectImpact } from './impact';

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
  'decision_type',
  'evidence_strength',
  'source_type',
  'source_group',
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
  // Plus the computed project impact (high / medium / low), as on the site.
  const header = [...columns, 'impact'].join(',');
  const rows = records.map((r) => [...columns.map((c) => escapeCsvCell(c === 'decision_type' ? decisionOf(r) : r[c])), projectImpact(r)].join(','));
  return [header, ...rows].join('\n');
}

/** A table of plain rows (a chart's numbers) as CSV, columns in the order of the first row. */
export function rowsToCsv(rows: Record<string, string | number | null | undefined>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => escapeCsvCell(r[c] ?? '')).join(','))].join('\n');
}

export function saveFile(filename: string, content: Blob | string, type = 'text/csv;charset=utf-8;'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, records: CatalogueRecord[], columns?: (keyof CatalogueRecord)[]): void {
  saveFile(filename, toCsv(records, columns));
}


export { ALL_COLUMNS };
