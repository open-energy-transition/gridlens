import { describe, expect, it } from 'vitest';
import { impactOf, projectImpact, rankProjects } from './impact';
import type { CatalogueRecord } from '../types';

describe('impactOf', () => {
  it('rates decision-makers high, advisers medium and research low', () => {
    expect(impactOf({ institution_category: 'utility_tso', role: 'direct_user' })).toBe('high');
    expect(impactOf({ institution_category: 'government_regulator', role: 'commissioner' })).toBe('high');
    expect(impactOf({ institution_category: 'consultancy', role: 'consultant_modeler' })).toBe('medium');
    expect(impactOf({ institution_category: 'development_bank', role: 'commissioner' })).toBe('medium');
    expect(impactOf({ institution_category: 'academic_research', role: 'research_user' })).toBe('low');
  });

  it('rates an organization that was only the subject of a study low', () => {
    expect(impactOf({ institution_category: 'utility_tso', role: 'subject_of_study' })).toBe('low');
  });
});

function project(id: string, category: string, scope: CatalogueRecord['geo_scope'], label: string): CatalogueRecord {
  const org = { name: id, role: 'direct_user', institution_category: category, country_label: label };
  return {
    project_id: id, institution_name: id, institution_category: category, role: 'direct_user', country_label: label,
    countries: scope === 'national' ? [label] : [], geo_scope: scope, region_label: scope === 'national' ? '' : label,
    organizations: [org], summary: 's', decision_basis: 'documented',
  } as unknown as CatalogueRecord;
}

describe('projectImpact', () => {
  it('takes the highest impact of the organizations', () => {
    const p = project('p', 'academic_research', 'national', 'Spain');
    p.organizations = [...p.organizations, { name: 'TSO', role: 'commissioner', institution_category: 'utility_tso', country_label: 'Spain' }];
    expect(projectImpact(p)).toBe('high');
  });
});

describe('rankProjects', () => {
  it('orders each impact level national, then multi-country, then global for the selected country', () => {
    const rows = [
      project('medium-global', 'consultancy', 'global', 'Global'),
      project('high-global', 'utility_tso', 'global', 'Global'),
      project('medium-spain', 'consultancy', 'national', 'Spain'),
      project('high-eu', 'government_regulator', 'multi_country', 'European Union'),
      project('high-spain', 'utility_tso', 'national', 'Spain'),
      project('medium-eu', 'consultancy', 'multi_country', 'European Union'),
    ];
    expect(rankProjects(rows, 'Spain').map((r) => r.project_id)).toEqual([
      'high-spain', 'high-eu', 'high-global', 'medium-spain', 'medium-eu', 'medium-global',
    ]);
  });
});
