import { describe, expect, it } from 'vitest';
import { adoptionBySector, adoptionByTool } from './filters';
import { alphaHex } from './colors';
import type { CatalogueRecord } from '../types';

const org = (name: string, institution_category: string, role = 'direct_user') => ({ name, role, institution_category, country_label: 'Chile' });
const rec = (tool_name: string, organizations: ReturnType<typeof org>[]) => ({ tool_name, organizations } as unknown as CatalogueRecord);

describe('adoptionBySector', () => {
  it('splits each tool into industry, academia and other, adding up to its adoption count', () => {
    const records = [
      rec('PyPSA', [org('TSO', 'utility_tso'), org('Uni', 'academic_research')]),
      rec('PyPSA', [org('Uni', 'academic_research'), org('Assoc', 'industry_association'), org('Studied', 'utility_tso', 'subject_of_study')]),
    ];
    expect(adoptionBySector(records).get('PyPSA')).toEqual({ industry: 1, academia: 1, other: 1 });
    expect(adoptionByTool(records)[0].count).toBe(3);
  });
});

describe('alphaHex', () => {
  it('turns an opacity into two hex digits', () => {
    expect(alphaHex(1)).toBe('ff');
    expect(alphaHex(0)).toBe('00');
    expect(alphaHex(0.45)).toBe('73');
  });
});
