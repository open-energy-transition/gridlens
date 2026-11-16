import type { CatalogueRecord } from '../types';
import { orgGroup } from './orgTypes';
import { coversCountry, SCOPE_ORDER } from './regions';

export type Impact = 'high' | 'medium' | 'low';

export const IMPACT_INFO: Record<Impact, { label: string; description: string }> = {
  high: {
    label: 'High impact',
    description: 'A grid operator, utility, regulator or ministry used or commissioned the modelling for a real-world decision.',
  },
  medium: {
    label: 'Medium impact',
    description: 'Consultancies, vendors and international or development bodies, usually advising the decision-makers above.',
  },
  low: {
    label: 'Lower impact',
    description: 'Academic and think-tank research, or studies in which the organization was only the subject.',
  },
};

const DECISION_MAKERS = new Set(['grid_operator', 'utility', 'regulator', 'government']);
const ADVISERS = new Set(['consultancy', 'international', 'other']);

/** How directly a record reflects a real-world grid decision. */
export function impactOf(r: Pick<CatalogueRecord, 'institution_category' | 'role'>): Impact {
  if (r.role === 'subject_of_study') return 'low';
  const g = orgGroup(r);
  if (DECISION_MAKERS.has(g)) return 'high';
  if (ADVISERS.has(g)) return 'medium';
  return 'low';
}

export const IMPACT_ORDER: Impact[] = ['high', 'medium', 'low'];

/** A project's impact is the highest impact of any organization in it. */
export function projectImpact(r: Pick<CatalogueRecord, 'organizations' | 'institution_category' | 'role'>): Impact {
  const orgs = r.organizations?.length ? r.organizations : [r];
  return IMPACT_ORDER.find((level) => orgs.some((o) => impactOf(o) === level)) ?? 'low';
}

/**
 * Highest impact first. With a country selected, each impact level lists that country's own
 * projects, then multi-country, then global ones. Ties: documented use cases with a summary first.
 */
export function rankProjects(records: CatalogueRecord[], country?: string): CatalogueRecord[] {
  const score = (r: CatalogueRecord) => {
    const scope = country ? coversCountry(r, country) : null;
    const scopeRank = country ? (scope ? SCOPE_ORDER.indexOf(scope) : SCOPE_ORDER.length) : 0;
    return (
      IMPACT_ORDER.indexOf(projectImpact(r)) * 100 +
      scopeRank * 10 +
      (r.decision_basis === 'documented' ? 0 : 2) +
      (r.summary.trim() ? 0 : 1)
    );
  };
  return [...records].sort((a, b) => score(a) - score(b));
}
