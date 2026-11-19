import type { CatalogueRecord, Filters } from '../types';
import { splitCategories } from './toolCategories';
import { orgGroup, sectorOf } from './orgTypes';
import { toolInfo } from './tools';
import { coversCountry } from './regions';

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
    if (filters.country !== 'All' && coversCountry(r, filters.country) === null) return false;
    if (filters.orgType !== 'All' && !r.organizations.some((o) => orgGroup(o) === filters.orgType)) return false;
    if (filters.sector !== 'All' && !r.organizations.some((o) => sectorOf(o) === filters.sector)) return false;
    if (filters.sourceGroup !== 'All' && r.source_group !== filters.sourceGroup) return false;
    if (search) {
      const haystack = [...Object.values(r).map(safe), ...r.organizations.map((o) => o.name)].join(' | ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.toolName !== 'All' && safe(r.tool_name) !== filters.toolName) return false;
    if (filters.toolCategory !== 'All' && !splitCategories(r.tool_category).includes(filters.toolCategory)) return false;
    if (filters.evidenceStrength !== 'All' && safe(r.evidence_strength) !== filters.evidenceStrength) return false;
    if (filters.license !== 'All' && toolInfo(r.tool_name)?.license !== filters.license) return false;
    return true;
  });
}

export function countBy(records: CatalogueRecord[], field: keyof CatalogueRecord) {
  const counts = new Map<string, number>();
  for (const r of records) {
    const v = safe(r[field]);
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** Count projects per organization across all projects' `organizations` arrays. */
export function countByOrganization(records: CatalogueRecord[]) {
  const counts = new Map<string, number>();
  for (const r of records) {
    const seen = new Set<string>();
    for (const org of r.organizations) {
      if (org.name && !seen.has(org.name)) {
        seen.add(org.name);
        counts.set(org.name, (counts.get(org.name) ?? 0) + 1);
      }
    }
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

/**
 * Adoption ranking: per tool, the number of distinct organizations using it (optionally only organizations
 * of one sector), largest first.
 */
export function adoptionByTool(records: CatalogueRecord[], sector = 'All') {
  const orgs = new Map<string, Set<string>>();
  for (const r of records) {
    for (const o of r.organizations) {
      if (sector !== 'All' && sectorOf(o) !== sector) continue;
      if (!orgs.has(r.tool_name)) orgs.set(r.tool_name, new Set());
      orgs.get(r.tool_name)!.add(o.name);
    }
  }
  return [...orgs].map(([name, s]) => ({ name, count: s.size })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
