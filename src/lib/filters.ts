import type { CatalogueRecord, Filters } from '../types';

export function safe(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function uniqSorted(records: CatalogueRecord[], field: keyof CatalogueRecord): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const v = safe(r[field]);
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function applyFilters(records: CatalogueRecord[], filters: Filters): CatalogueRecord[] {
  const search = filters.search.trim().toLowerCase();
  return records.filter((r) => {
    if (filters.country !== 'All' && safe(r.country_label) !== filters.country) return false;
    if (filters.toolCategory !== 'All' && safe(r.tool_category) !== filters.toolCategory) return false;
    if (filters.evidenceStrength !== 'All' && safe(r.evidence_strength) !== filters.evidenceStrength) return false;
    if (filters.sourceType !== 'All' && safe(r.source_type) !== filters.sourceType) return false;
    if (search) {
      const haystack = Object.values(r).map((v) => safe(v).toLowerCase()).join(' | ');
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function countBy(records: CatalogueRecord[], field: keyof CatalogueRecord, includeEmpty = false) {
  const counts = new Map<string, number>();
  for (const r of records) {
    const v = safe(r[field]);
    if (!v && !includeEmpty) continue;
    const key = v || '(empty)';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function uniqueCount(records: CatalogueRecord[], field: keyof CatalogueRecord): number {
  const set = new Set<string>();
  for (const r of records) {
    const v = safe(r[field]);
    if (v) set.add(v);
  }
  return set.size;
}
