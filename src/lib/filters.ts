import type { CatalogueRecord, Filters } from '../types';
import { splitCategories } from './toolCategories';
import { orgGroup, sectorOf, usersOf } from './orgTypes';
import { toolInfo } from './tools';
import { coversCountry } from './regions';
import { decisionOf } from './insights';
import { projectImpact } from './impact';
import { matcher, valuesOf } from './multi';

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

/** Periods offered in the filter, in years back from the current year (inclusive). */
export const PERIODS = ['1', '2', '3', '5', '10', '15', '20'];

/** First year of a period: the last 5 years in 2026 are 2022–2026. */
export function periodStart(period: string, thisYear = new Date().getFullYear()): number {
  return thisYear - Number(period) + 1;
}

export function applyFilters(records: CatalogueRecord[], filters: Filters, thisYear = new Date().getFullYear()): CatalogueRecord[] {
  const search = filters.search.trim().toLowerCase();
  const since = filters.period === 'All' ? null : periodStart(filters.period, thisYear);
  // Multi-value filters ("Spain|France"): a record passes when it matches any chosen value.
  const countries = valuesOf(filters.country);
  const [orgType, decision, impact, tool, category, evidence] =
    [filters.orgType, filters.decision, filters.impact, filters.toolName, filters.toolCategory, filters.evidenceStrength].map(matcher);
  return records.filter((r) => {
    // Undated studies are left out of a period (we cannot say they are recent) unless the reader includes them.
    if (since !== null && (r.year ? r.year < since : filters.undated !== 'include')) return false;
    if (countries.length && !countries.some((c) => coversCountry(r, c) !== null)) return false;
    if (!r.organizations.some((o) => orgType(orgGroup(o)))) return false;
    if (filters.sector !== 'All' && !r.organizations.some((o) => sectorOf(o) === filters.sector)) return false;
    if (filters.sourceGroup !== 'All' && r.source_group !== filters.sourceGroup) return false;
    if (!decision(decisionOf(r))) return false;
    if (!impact(projectImpact(r))) return false;
    if (search) {
      const haystack = [...Object.values(r).map(safe), ...r.organizations.map((o) => o.name)].join(' | ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (!tool(safe(r.tool_name))) return false;
    if (filters.toolCategory !== 'All' && !splitCategories(r.tool_category).some(category)) return false;
    if (!evidence(safe(r.evidence_strength))) return false;
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
    for (const org of usersOf(r.organizations)) {
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
    for (const o of usersOf(r.organizations)) {
      if (sector !== 'All' && sectorOf(o) !== sector) continue;
      if (!orgs.has(r.tool_name)) orgs.set(r.tool_name, new Set());
      orgs.get(r.tool_name)!.add(o.name);
    }
  }
  return [...orgs].map(([name, s]) => ({ name, count: s.size })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Per tool, its distinct user organizations by sector: industry & government, academia & research, and other
 * (organizations of neither sector, e.g. industry associations). The three add up to the tool's adoption count.
 */
export function adoptionBySector(records: CatalogueRecord[]): Map<string, { industry: number; academia: number; other: number }> {
  const sectors = new Map<string, Map<string, string>>();
  for (const r of records) {
    for (const o of usersOf(r.organizations)) {
      if (!sectors.has(r.tool_name)) sectors.set(r.tool_name, new Map());
      sectors.get(r.tool_name)!.set(o.name, sectorOf(o));
    }
  }
  return new Map([...sectors].map(([tool, byOrg]) => {
    const n = { industry: 0, academia: 0, other: 0 };
    for (const s of byOrg.values()) n[s === 'industry' || s === 'academia' ? s : 'other'] += 1;
    return [tool, n];
  }));
}
