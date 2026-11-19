import { describe, expect, it } from 'vitest';
import type { CatalogueRecord, ProjectOrg } from '../types';
import { openShare, organizationDirectory, projectsPerYear, purposeMatrix, serviceProviders, toolStats } from './insights';
import { parsePath, slug } from './router';

const org = (name: string, institution_category: string, extra: Partial<ProjectOrg> = {}): ProjectOrg =>
  ({ name, role: 'direct_user', institution_category, country_label: 'Spain', ...extra });

function project(tool: string, orgs: ProjectOrg[], extra: Partial<CatalogueRecord> = {}): CatalogueRecord {
  return {
    country_label: 'Spain', institution_name: orgs[0].name, institution_category: orgs[0].institution_category, role: 'direct_user',
    official_website: '', tool_name: tool, tool_category: 'capacity_expansion', use_case: '', summary: '', evidence_strength: 'HIGH',
    source_type: '', source_group: 'industry', source_title: '', source_date: '', source_link: '', exact_snippet_or_quote: '',
    why_it_supports_the_claim: '', notes: '', dataset_origin: '', decision_type: 'Capacity & Resource Planning', decision_basis: 'documented',
    project_id: Math.random().toString(36), project_title: '', organizations: orgs, countries: ['Spain'], geo_scope: 'national',
    region_label: '', sources: [{ title: '', date: '', link: 'https://example.org/s', quote: '', source_type: '' }], year: null, ...extra,
  };
}

const ree = org('REE', 'utility_tso', { website: 'https://ree.es' });
const oet = org('Open Energy Transition', 'consultancy');
const uni = org('Uni', 'academic_research');
const ee = org('Energy Exemplar', 'vendor');

const data = [
  project('PyPSA', [ree, oet], { year: 2025 }),
  project('PyPSA', [uni], { year: 2024, decision_type: 'Academic & Research Studies' }),
  project('PLEXOS', [ree, ee], { year: 2019, decision_type: 'Unit Commitment & Dispatch' }),
  project('PLEXOS', [uni], { decision_type: '' }),
];

describe('purposeMatrix', () => {
  it('counts projects per tool and decision, without the catch-all by default', () => {
    const m = purposeMatrix(data);
    expect(m.decisions).toEqual(['Capacity & Resource Planning', 'Unit Commitment & Dispatch', 'Academic & Research Studies']);
    expect(m.rows.find((r) => r.tool === 'PyPSA')!.counts).toEqual([1, 0, 1]);
    expect(purposeMatrix(data, true).decisions).toContain('Other / General Modeling');
  });
});

describe('projectsPerYear and openShare', () => {
  it('splits dated projects by licence and skips undated ones', () => {
    const y = projectsPerYear(data, 2019, 2025);
    expect(y[0]).toEqual({ year: 2019, open: 0, proprietary: 1 });
    expect(y[6]).toEqual({ year: 2025, open: 1, proprietary: 0 });
    expect(openShare(data, 2024, 2025)).toBe(1);
    expect(openShare(data, 2000, 2001)).toBeNull();
  });
});

describe('organizationDirectory', () => {
  it('merges an organization across projects and keeps its website and tools', () => {
    const r = organizationDirectory(data).find((o) => o.name === 'REE')!;
    expect(r.projects).toBe(2);
    expect(r.tools).toEqual(['PLEXOS', 'PyPSA']);
    expect(r.website).toBe('https://ree.es');
    expect(r.decisionProjects).toBe(2);
    expect(r.latestYear).toBe(2025);
  });
});

describe('serviceProviders', () => {
  it('lists consultancies, not tool vendors, optionally for open-source tools only', () => {
    expect(serviceProviders(data).map((o) => o.name)).toEqual(['Open Energy Transition']);
    expect(serviceProviders(data, { tool: 'PLEXOS' })).toEqual([]);
    expect(serviceProviders(data, { openOnly: true }).map((o) => o.name)).toEqual(['Open Energy Transition']);
  });
});

describe('toolStats', () => {
  it('counts organizations, decision-makers and recent projects per tool', () => {
    const s = toolStats(data, 2026).find((t) => t.name === 'PyPSA')!;
    expect(s).toMatchObject({ projects: 2, organizations: 3, decisionMakers: 1, gridOperators: 1, recentProjects: 2, firstYear: 2024, lastYear: 2025 });
    expect(s.perYear.at(-2)).toBe(1);
  });
});

describe('routes', () => {
  it('slugs tool names', () => {
    expect(slug('PSS/E')).toBe('pss-e');
    expect(slug('DIgSILENT PowerFactory')).toBe('digsilent-powerfactory');
  });

  it('sends old pages to their new home', () => {
    expect(parsePath('/grid-decisions')).toEqual({ route: { page: '/' }, hash: 'decisions' });
    expect(parsePath('/top-users/PSS%2FE')).toEqual({ route: { page: '/tools', tool: 'pss-e' } });
    expect(parsePath('/records/')).toEqual({ route: { page: '/projects' } });
    expect(parsePath('/about')).toEqual({ route: { page: '/methodology' } });
    expect(parsePath('/nope')).toEqual({ route: { page: '/' } });
    expect(parsePath('/tools')).toEqual({ route: { page: '/tools' } });
  });
});
