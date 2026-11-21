import { describe, expect, it } from 'vitest';
import { filtersToSearch, mergeFilterSearch, searchToFilters } from './filterParams';
import { DEFAULT_FILTERS } from '../types';

describe('filter query string', () => {
  it('is empty without filters', () => {
    expect(filtersToSearch(DEFAULT_FILTERS)).toBe('');
    expect(searchToFilters('')).toEqual(DEFAULT_FILTERS);
  });

  it('round-trips active filters, including spaces and special characters', () => {
    const f = { ...DEFAULT_FILTERS, country: 'Bosnia and Herzegovina', toolName: 'PSS/E', orgType: 'grid_operator', sector: 'industry', period: '10', search: 'TYNDP & flex' };
    const s = filtersToSearch(f);
    expect(s).toBe('?country=Bosnia+and+Herzegovina&tool=PSS%2FE&org=grid_operator&sector=industry&years=10&q=TYNDP+%26+flex');
    expect(searchToFilters(s)).toEqual(f);
  });

  it('defaults to the last five years; all years are written out', () => {
    expect(searchToFilters('').period).toBe('5');
    expect(filtersToSearch({ ...DEFAULT_FILTERS, period: 'All', undated: 'include' })).toBe('?years=All&undated=include');
  });

  it('ignores unknown keys', () => {
    expect(searchToFilters('?country=Spain&utm_source=x')).toEqual({ ...DEFAULT_FILTERS, country: 'Spain' });
  });
});

describe('shared filters in the URL', () => {
  it('replaces the filter keys and leaves other parameters of the page alone', () => {
    expect(mergeFilterSearch('?type=consultancy&tool=PyPSA&country=Chile', { ...DEFAULT_FILTERS, country: 'Spain' })).toBe('?type=consultancy&country=Spain');
    expect(mergeFilterSearch('?country=Chile', DEFAULT_FILTERS)).toBe('');
  });
});
