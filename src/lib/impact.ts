import type { CatalogueRecord } from '../types';
import { orgGroup } from './orgTypes';

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
