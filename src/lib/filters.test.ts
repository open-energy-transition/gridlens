import { describe, it, expect } from 'vitest';
import { adoptionByTool, applyFilters, periodStart, countBy, countByOrganization, uniqSorted, uniqueCount, safe } from './filters';
import type { CatalogueRecord, Filters } from '../types';
import { EMPTY_FILTERS } from '../types';

function record(overrides: Partial<CatalogueRecord> = {}): CatalogueRecord {
  const country = overrides.country_label ?? 'Brazil';
  const instName = overrides.institution_name ?? 'ONS';
  const orgCountry = overrides.organizations?.[0]?.country_label ?? country;
  const orgCategory = overrides.organizations?.[0]?.institution_category ?? (overrides.institution_category ?? 'utility_iso_rto');
  return {
    country_label: country,
    institution_name: instName,
    institution_category: overrides.institution_category ?? 'utility_iso_rto',
    role: 'direct_user',
    official_website: '',
    tool_name: overrides.tool_name ?? 'NEWAVE',
    tool_category: 'production_cost',
    use_case: 'Planning',
    summary: '',
    evidence_strength: overrides.evidence_strength ?? 'HIGH',
    source_type: 'news_release',
    source_group: overrides.source_group ?? 'industry',
    source_title: '',
    source_date: '',
    source_link: 'https://example.com',
    exact_snippet_or_quote: '',
    why_it_supports_the_claim: '',
    notes: '',
    dataset_origin: 'esm_usage_catalog',
    decision_type: 'System Operation & Flexibility',
    decision_basis: 'documented',
    project_id: overrides.project_id ?? 'P1',
    project_title: 'Test Project',
    organizations: [{ name: instName, role: 'direct_user', institution_category: orgCategory, country_label: orgCountry }],
    countries: [country],
    geo_scope: overrides.geo_scope ?? 'national',
    region_label: '',
    sources: [{ title: '', date: '', link: 'https://example.com', quote: '', source_type: 'news_release' }],
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
    record({ country_label: 'Brazil', tool_name: 'NEWAVE', geo_scope: 'national' }),
    record({ country_label: 'United States of America', institution_name: 'NREL', tool_name: 'PLEXOS', evidence_strength: 'MEDIUM', geo_scope: 'national' }),
    record({ country_label: 'United States of America', institution_name: 'LBNL', tool_name: 'PyPSA', institution_category: 'academic_research', source_group: 'academic', geo_scope: 'national' }),
  ];
  const f = (overrides: Partial<Filters> = {}): Filters => ({ ...EMPTY_FILTERS, ...overrides });

  it('returns everything when every filter is "All" and search is empty', () => {
    expect(applyFilters(records, f())).toHaveLength(3);
  });

  it('matches a category anywhere in a multi-category record', () => {
    const multi = [
      record({ tool_category: 'capacity_expansion; production_cost', geo_scope: 'national' }),
      record({ tool_category: 'power_flow_dynamics', geo_scope: 'national' }),
    ];
    expect(applyFilters(multi, f({ toolCategory: 'production_cost' }))).toHaveLength(1);
    expect(applyFilters(multi, f({ toolCategory: 'capacity_expansion' }))).toHaveLength(1);
    expect(applyFilters(multi, f({ toolCategory: 'other' }))).toHaveLength(0);
  });

  it('filters by country via coversCountry', () => {
    const result = applyFilters(records, f({ country: 'Brazil' }));
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('NEWAVE');
  });

  it('filters by tool name', () => {
    const result = applyFilters(records, f({ toolName: 'PLEXOS' }));
    expect(result).toHaveLength(1);
    expect(result[0].tool_name).toBe('PLEXOS');
  });

  it('filters by organization group across organizations', () => {
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

  it('free-text search matches across all fields and organization names', () => {
    expect(applyFilters(records, f({ search: 'pypsa' }))).toHaveLength(1);
    expect(applyFilters(records, f({ search: 'ons' }))).toHaveLength(1);
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

describe('countByOrganization', () => {
  it('counts a single-org project once', () => {
    const records = [record()];
    expect(countByOrganization(records)).toEqual([{ name: 'ONS', count: 1 }]);
  });

  it('counts a 2-org project once per organization', () => {
    const proj = record({
      organizations: [
        { name: 'ACER', role: 'commissioner', institution_category: 'international_body', country_label: 'Multi-country' },
        { name: 'ENTSO-E', role: 'commissioner', institution_category: 'international_body', country_label: 'Multi-country' },
      ],
      countries: ['Germany', 'France', 'Spain'],
      geo_scope: 'multi_country',
      region_label: 'European Union',
    });
    const result = countByOrganization([proj]);
    expect(result).toHaveLength(2);
    expect(result.find(r => r.name === 'ACER')?.count).toBe(1);
    expect(result.find(r => r.name === 'ENTSO-E')?.count).toBe(1);
  });

  it('counts the same org across multiple projects', () => {
    const proj1 = record({ organizations: [{ name: 'ONS', role: 'direct_user', institution_category: 'utility_iso_rto', country_label: 'Brazil' }] });
    const proj2 = record({ project_id: 'P2', organizations: [{ name: 'ONS', role: 'consultant_modeler', institution_category: 'utility_iso_rto', country_label: 'Brazil' }] });
    const result = countByOrganization([proj1, proj2]);
    expect(result.find(r => r.name === 'ONS')?.count).toBe(2);
  });

  it('does not count an organization that was only the subject of the study', () => {
    const proj = record({
      organizations: [
        { name: 'MIT', role: 'research_user', institution_category: 'academic_research', country_label: 'United States' },
        { name: 'PLN', role: 'subject_of_study', institution_category: 'utility_generation', country_label: 'Indonesia' },
      ],
    });
    expect(countByOrganization([proj])).toEqual([{ name: 'MIT', count: 1 }]);
    expect(adoptionByTool([proj])[0].count).toBe(1);
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

describe('sector', () => {
  const mixed = record({
    tool_name: 'PyPSA',
    organizations: [
      { name: 'TSO', role: 'commissioner', institution_category: 'utility_tso', country_label: 'Brazil' },
      { name: 'Uni', role: 'research_user', institution_category: 'academic_research', country_label: 'Brazil' },
    ],
  });
  const academic = record({
    tool_name: 'PyPSA',
    organizations: [{ name: 'Uni', role: 'research_user', institution_category: 'academic_research', country_label: 'Brazil' }],
  });
  const industry = record({
    tool_name: 'PLEXOS',
    organizations: [{ name: 'TSO', role: 'direct_user', institution_category: 'utility_tso', country_label: 'Brazil' }],
  });

  it('filters projects with any organization in the sector', () => {
    expect(applyFilters([mixed, academic, industry], { ...EMPTY_FILTERS, sector: 'industry' })).toEqual([mixed, industry]);
    expect(applyFilters([mixed, academic, industry], { ...EMPTY_FILTERS, sector: 'academia' })).toEqual([mixed, academic]);
  });

  it('ranks tools by distinct organizations, optionally of one sector', () => {
    expect(adoptionByTool([mixed, academic, industry])).toEqual([{ name: 'PyPSA', count: 2 }, { name: 'PLEXOS', count: 1 }]);
    expect(adoptionByTool([mixed, academic, industry], 'industry')).toEqual([{ name: 'PLEXOS', count: 1 }, { name: 'PyPSA', count: 1 }]);
  });
});

describe('study period', () => {
  const recent = record({ tool_name: 'PyPSA', year: 2025 });
  const edge = record({ tool_name: 'PyPSA', year: 2022 });
  const old = record({ tool_name: 'PyPSA', year: 2009 });
  const undated = record({ tool_name: 'PyPSA' });

  it('starts the period so that it includes the current year', () => {
    expect(periodStart('5', 2026)).toBe(2022);
  });

  it('keeps dated studies inside the period and leaves undated ones out', () => {
    const all = [recent, edge, old, undated];
    expect(applyFilters(all, { ...EMPTY_FILTERS, period: '5' }, 2026)).toEqual([recent, edge]);
    expect(applyFilters(all, { ...EMPTY_FILTERS, period: '20' }, 2026)).toEqual([recent, edge, old]);
    expect(applyFilters(all, EMPTY_FILTERS, 2026)).toEqual(all);
  });

  it('counts undated studies in a period only when the reader includes them', () => {
    expect(applyFilters([recent, old, undated], { ...EMPTY_FILTERS, period: '5', undated: 'include' }, 2026)).toEqual([recent, undated]);
  });
});

describe('grid decision and impact filters', () => {
  const operator = record({ project_id: 'A', decision_type: 'Transmission & Distribution Planning' });
  const research = record({
    project_id: 'B', decision_type: '', institution_category: 'academic_research',
    organizations: [{ name: 'Uni', role: 'research_user', institution_category: 'academic_research', country_label: 'Brazil' }],
  });

  it('keep projects of one decision type; an empty type counts as not specified', () => {
    expect(applyFilters([operator, research], { ...EMPTY_FILTERS, decision: 'Transmission & Distribution Planning' })).toEqual([operator]);
    expect(applyFilters([operator, research], { ...EMPTY_FILTERS, decision: 'Not specified' })).toEqual([research]);
  });

  it('keep projects of one impact level', () => {
    expect(applyFilters([operator, research], { ...EMPTY_FILTERS, impact: 'high' })).toEqual([operator]);
    expect(applyFilters([operator, research], { ...EMPTY_FILTERS, impact: 'low' })).toEqual([research]);
  });
});

describe('several values in one filter', () => {
  it('keep projects in any chosen country or tool', () => {
    const es = record({ project_id: 'E', country_label: 'Spain', tool_name: 'PyPSA' });
    const fr = record({ project_id: 'F', country_label: 'France', tool_name: 'PLEXOS' });
    const de = record({ project_id: 'D', country_label: 'Germany', tool_name: 'PyPSA' });
    expect(applyFilters([es, fr, de], { ...EMPTY_FILTERS, country: 'Spain|France' })).toEqual([es, fr]);
    expect(applyFilters([es, fr, de], { ...EMPTY_FILTERS, toolName: 'PLEXOS|PyPSA', country: 'Germany|France' })).toEqual([fr, de]);
  });
});
