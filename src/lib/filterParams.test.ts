import { describe, expect, it } from 'vitest';
import { filtersToSearch, searchToFilters } from './filterParams';
import { EMPTY_FILTERS } from '../types';

describe('filter query string', () => {
  it('is empty without filters', () => {
    expect(filtersToSearch(EMPTY_FILTERS)).toBe('');
    expect(searchToFilters('')).toEqual(EMPTY_FILTERS);
  });

  it('round-trips active filters, including spaces and special characters', () => {
    const f = { ...EMPTY_FILTERS, country: 'Bosnia and Herzegovina', toolName: 'PSS/E', orgType: 'grid_operator', sector: 'industry', search: 'TYNDP & flex' };
    const s = filtersToSearch(f);
    expect(s).toBe('?country=Bosnia+and+Herzegovina&tool=PSS%2FE&org=grid_operator&sector=industry&q=TYNDP+%26+flex');
    expect(searchToFilters(s)).toEqual(f);
  });

  it('ignores unknown keys', () => {
    expect(searchToFilters('?country=Spain&utm_source=x')).toEqual({ ...EMPTY_FILTERS, country: 'Spain' });
  });
});
