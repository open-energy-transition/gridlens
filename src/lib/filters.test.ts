import { describe, it, expect } from 'vitest';
import { applyFilters, countBy, uniqSorted, uniqueCount, safe } from './filters';
import type { CatalogueRecord, Filters } from '../types';
import { EMPTY_FILTERS } from '../types';

function record(overrides: Partial<CatalogueRecord> = {}): CatalogueRecord {
  return {
    country_label: 'Brazil',
    institution_name: 'ONS',
    institution_category: 'utility_iso_rto',
    role: 'direct_user',
    official_website: '',
    tool_name: 'NEWAVE',
    tool_category: 'production_cost',
    use_case: 'Planning',
    summary: '',
    evidence_strength: 'HIGH',
    source_type: 'news_release',
    source_group: 'industry',
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
    record({ country_label: 'United States of America', tool_name: 'PyPSA', institution_category: 'academic_research', source_group: 'academic' }),
  ];
  const f = (overrides: Partial<Filters> = {}): Filters => ({ ...EMPTY_FILTERS, ...overrides });

  it('returns everything when every filter is "All" and search is empty', () => {
    expect(applyFilters(records, f())).toHaveLength(3);
  });

  it('matches a category anywhere in a multi-category record', () => {
    const multi = [
      record({ tool_category: 'capacity_expansion; production_cost' }),
      record({ tool_category: 'power_flow_dynamics' }),
    ];
    expect(applyFilters(multi, f({ toolCategory: 'production_cost' }))).toHaveLength(1);
    expect(applyFilters(multi, f({ toolCategory: 'capacity_expansion' }))).toHaveLength(1);
    expect(applyFilters(multi, f({ toolCategory: 'other' }))).toHaveLength(0);
  });

  it('filters by country', () => {
    const result = applyFilters(records, f({ country: 'Brazil' }));
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('NEWAVE');
  });

  it('filters by tool name', () => {
    const result = applyFilters(records, f({ toolName: 'PLEXOS' }));
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('PLEXOS');
  });

  it('filters by organization group, licence and source group', () => {
    expect(applyFilters(records, f({ orgType: 'grid_operator' }))).toHaveLength(2);
    expect(applyFilters(records, f({ orgType: 'research' }))[0].tool_name).toBe('PyPSA');
    expect(applyFilters(records, f({ license: 'open_source' })).map((r) => r.tool_name)).toEqual(['PyPSA']);
    expect(applyFilters(records, f({ license: 'proprietary' })).map((r) => r.tool_name)).toEqual(['PLEXOS']);
    expect(applyFilters(records, f({ sourceGroup: 'academic' }))).toHaveLength(1);
  });

  it('combines multiple filters with AND logic', () => {
    const result = applyFilters(records, f({ country: 'United States of America', evidenceStrength: 'MEDIUM' }));
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('PLEXOS');
  });

  it('free-text search matches across all fields, case-insensitively', () => {
    expect(applyFilters(records, f({ search: 'pypsa' }))).toHaveLength(1);
  });
});

describe('countBy', () => {
  it('counts occurrences and sorts descending', () => {
    const records = [record({ tool_name: 'PLEXOS' }), record({ tool_name: 'PLEXOS' }), record({ tool_name: 'PyPSA' })];
    const result = countBy(records, 'tool_name');
    expect(result[0]).toEqual({ name: 'PLEXOS', count: 2 });
    expect(result[1]).toEqual({ name: 'PyPSA', count: 1 });
  });

  it('skips empty values', () => {
    const records = [record({ tool_name: '' }), record({ tool_name: 'PLEXOS' })];
    expect(countBy(records, 'tool_name')).toHaveLength(1);
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
