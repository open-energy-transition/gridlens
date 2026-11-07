import { describe, it, expect } from 'vitest';
import { applyFilters, countBy, uniqSorted, uniqueCount, safe } from './filters';
import type { CatalogueRecord } from '../types';

function record(overrides: Partial<CatalogueRecord> = {}): CatalogueRecord {
  return {
    country_label: 'Brazil',
    institution_name: 'ONS',
    official_website: '',
    tool_name: 'NEWAVE',
    tool_category: 'production_cost_uc',
    use_case: 'Planning',
    evidence_strength: 'HIGH',
    source_type: 'news_release',
    source_title: '',
    source_date: '',
    source_link: 'https://example.com',
    exact_snippet_or_quote: '',
    why_it_supports_the_claim: '',
    notes: '',
    dataset_origin: 'esm_usage_catalog',
    decision_type: 'Unit Commitment & Dispatch',
    decision_basis: 'documented',
    ...overrides,
  };
}

describe('safe', () => {
  it('coerces null/undefined to an empty string', () => {
    expect(safe(null)).toBe('');
    expect(safe(undefined)).toBe('');
  });
  it('trims strings', () => {
    expect(safe('  hello  ')).toBe('hello');
  });
});

describe('applyFilters', () => {
  const records = [
    record({ country_label: 'Brazil', tool_name: 'NEWAVE' }),
    record({ country_label: 'United States of America', tool_name: 'PLEXOS', evidence_strength: 'MEDIUM' }),
    record({ country_label: 'United States of America', tool_name: 'PyPSA' }),
  ];

  it('returns everything when every filter is "All" and search is empty', () => {
    expect(
      applyFilters(records, { country: 'All', toolName: 'All', toolCategory: 'All', evidenceStrength: 'All', sourceType: 'All', search: '' }),
    ).toHaveLength(3);
  });

  it('filters by country', () => {
    const result = applyFilters(records, { country: 'Brazil', toolName: 'All', toolCategory: 'All', evidenceStrength: 'All', sourceType: 'All', search: '' });
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('NEWAVE');
  });

  it('filters by tool name', () => {
    const result = applyFilters(records, { country: 'All', toolName: 'PLEXOS', toolCategory: 'All', evidenceStrength: 'All', sourceType: 'All', search: '' });
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('PLEXOS');
  });

  it('combines multiple filters with AND logic', () => {
    const result = applyFilters(records, {
      country: 'United States of America',
      toolName: 'All',
      toolCategory: 'All',
      evidenceStrength: 'MEDIUM',
      sourceType: 'All',
      search: '',
    });
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('PLEXOS');
  });

  it('free-text search matches across all fields, case-insensitively', () => {
    const result = applyFilters(records, { country: 'All', toolName: 'All', toolCategory: 'All', evidenceStrength: 'All', sourceType: 'All', search: 'pypsa' });
    expect(result).toHaveLength(1);
  });
});

describe('countBy', () => {
  it('counts occurrences and sorts descending', () => {
    const records = [record({ tool_name: 'PLEXOS' }), record({ tool_name: 'PLEXOS' }), record({ tool_name: 'PyPSA' })];
    const result = countBy(records, 'tool_name');
    expect(result[0]).toEqual({ name: 'PLEXOS', count: 2 });
    expect(result[1]).toEqual({ name: 'PyPSA', count: 1 });
  });

  it('excludes empty values unless includeEmpty is true', () => {
    const records = [record({ tool_name: '' }), record({ tool_name: 'PLEXOS' })];
    expect(countBy(records, 'tool_name')).toHaveLength(1);
    expect(countBy(records, 'tool_name', true)).toHaveLength(2);
  });
});

describe('uniqSorted / uniqueCount', () => {
  const records = [record({ country_label: 'Brazil' }), record({ country_label: 'Canada' }), record({ country_label: 'Brazil' })];

  it('uniqSorted deduplicates and sorts alphabetically', () => {
    expect(uniqSorted(records, 'country_label')).toEqual(['Brazil', 'Canada']);
  });

  it('uniqueCount matches uniqSorted length', () => {
    expect(uniqueCount(records, 'country_label')).toBe(2);
  });
});
