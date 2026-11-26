import { describe, it, expect } from 'vitest';
import { coversCountry, SCOPE_ORDER, SCOPE_LABELS, EU_MEMBERS, EUROPE } from './regions';
import type { CatalogueRecord } from '../types';

function nationalProject(overrides: Partial<CatalogueRecord> = {}): CatalogueRecord {
  return {
    country_label: 'Spain',
    institution_name: 'REE',
    institution_category: 'utility_tso',
    role: 'direct_user',
    official_website: '',
    tool_name: 'PLEXOS',
    tool_category: 'capacity_expansion',
    use_case: 'Planning',
    summary: '',
    evidence_strength: 'HIGH',
    source_type: 'official_report',
    source_group: 'industry',
    source_title: '',
    source_date: '',
    source_link: 'https://example.com',
    exact_snippet_or_quote: '',
    why_it_supports_the_claim: '',
    notes: '',
    dataset_origin: 'batch',
    decision_type: 'Generation & Storage Investment',
    decision_basis: 'documented',
    project_id: 'P1',
    project_title: 'Spain Study',
    organizations: [{ name: 'REE', role: 'direct_user', institution_category: 'utility_tso', country_label: 'Spain' }],
    countries: ['Spain'],
    geo_scope: 'national',
    region_label: '',
    sources: [{ title: '', date: '', link: 'https://example.com', quote: '', source_type: 'official_report' }],
    ...overrides,
  };
}

function multiCountryProject(overrides: Partial<CatalogueRecord> = {}): CatalogueRecord {
  return {
    country_label: 'European Union',
    institution_name: 'ENTSO-E',
    institution_category: 'international_body',
    role: 'commissioner',
    official_website: '',
    tool_name: 'TYNDP',
    tool_category: 'capacity_expansion',
    use_case: 'Planning',
    summary: '',
    evidence_strength: 'HIGH',
    source_type: 'official_report',
    source_group: 'industry',
    source_title: '',
    source_date: '',
    source_link: 'https://example.com',
    exact_snippet_or_quote: '',
    why_it_supports_the_claim: '',
    notes: '',
    dataset_origin: 'batch',
    decision_type: 'Generation & Storage Investment',
    decision_basis: 'documented',
    project_id: 'P2',
    project_title: 'EU Study',
    organizations: [{ name: 'ENTSO-E', role: 'commissioner', institution_category: 'international_body', country_label: 'European Union' }],
    countries: ['Germany', 'France', 'Spain', 'Italy'],
    geo_scope: 'multi_country',
    region_label: 'European Union',
    sources: [{ title: '', date: '', link: 'https://example.com', quote: '', source_type: 'official_report' }],
    ...overrides,
  };
}

function globalProject(overrides: Partial<CatalogueRecord> = {}): CatalogueRecord {
  return {
    country_label: 'Global',
    institution_name: 'IEA',
    institution_category: 'international_body',
    role: 'commissioner',
    official_website: '',
    tool_name: 'ETSAP',
    tool_category: 'capacity_expansion',
    use_case: 'Planning',
    summary: '',
    evidence_strength: 'HIGH',
    source_type: 'official_report',
    source_group: 'industry',
    source_title: '',
    source_date: '',
    source_link: 'https://example.com',
    exact_snippet_or_quote: '',
    why_it_supports_the_claim: '',
    notes: '',
    dataset_origin: 'batch',
    decision_type: 'Generation & Storage Investment',
    decision_basis: 'documented',
    project_id: 'P3',
    project_title: 'Global Study',
    organizations: [{ name: 'IEA', role: 'commissioner', institution_category: 'international_body', country_label: 'Global' }],
    countries: [],
    geo_scope: 'global',
    region_label: '',
    sources: [{ title: '', date: '', link: 'https://example.com', quote: '', source_type: 'official_report' }],
    ...overrides,
  };
}

function africaProject(): CatalogueRecord {
  return {
    country_label: 'Africa',
    institution_name: 'African Union',
    institution_category: 'international_body',
    role: 'commissioner',
    official_website: '',
    tool_name: 'TIMES',
    tool_category: 'capacity_expansion',
    use_case: 'Planning',
    summary: '',
    evidence_strength: 'MEDIUM',
    source_type: 'official_report',
    source_group: 'industry',
    source_title: '',
    source_date: '',
    source_link: 'https://example.com',
    exact_snippet_or_quote: '',
    why_it_supports_the_claim: '',
    notes: '',
    dataset_origin: 'batch',
    decision_type: 'Generation & Storage Investment',
    decision_basis: 'documented',
    project_id: 'P4',
    project_title: 'Africa Study',
    organizations: [{ name: 'African Union', role: 'commissioner', institution_category: 'international_body', country_label: 'Africa' }],
    countries: ['Nigeria', 'Kenya'],
    geo_scope: 'multi_country',
    region_label: 'Africa',
    sources: [{ title: '', date: '', link: 'https://example.com', quote: '', source_type: 'official_report' }],
  };
}

describe('coversCountry', () => {
  const spain = nationalProject();
  const eu = multiCountryProject();
  const glbl = globalProject();
  const africa = africaProject();

  it('returns national for Spain with a Spain national project', () => {
    expect(coversCountry(spain, 'Spain')).toBe('national');
  });

  it('returns multi_country for Spain with a European Union project', () => {
    expect(coversCountry(eu, 'Spain')).toBe('multi_country');
  });

  it('returns global for Spain with a Global project', () => {
    expect(coversCountry(glbl, 'Spain')).toBe('global');
  });

  it('returns null for Spain with an Africa project', () => {
    expect(coversCountry(africa, 'Spain')).toBeNull();
  });

  it('returns null for unknown country', () => {
    expect(coversCountry(spain, 'Unknown Country')).toBeNull();
  });

  it('covers all EU members via EU region_label', () => {
    for (const member of EU_MEMBERS) {
      expect(coversCountry(eu, member)).toBe('multi_country');
    }
  });

  it('covers all EUROPE countries via EUROPE list', () => {
    for (const country of EUROPE) {
      expect(coversCountry(eu, country)).toBe('multi_country');
    }
  });

  it('global project covers every country', () => {
    for (const country of ['Spain', 'Germany', 'Japan', 'Brazil']) {
      expect(coversCountry(glbl, country)).toBe('global');
    }
  });
});

describe('SCOPE_ORDER and SCOPE_LABELS', () => {
  it('SCOPE_ORDER has the right values in order', () => {
    expect(SCOPE_ORDER).toEqual(['national', 'multi_country', 'global']);
  });

  it('SCOPE_LABELS maps correctly', () => {
    expect(SCOPE_LABELS.national).toBe('National');
    expect(SCOPE_LABELS.multi_country).toBe('Multi-country');
    expect(SCOPE_LABELS.global).toBe('Global');
  });
});
