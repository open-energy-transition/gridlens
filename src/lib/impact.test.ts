import { describe, expect, it } from 'vitest';
import { impactOf } from './impact';

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
