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

  it('reads decision types of older links as their new names', () => {
    expect(searchToFilters('?decision=Capacity+%26+Resource+Planning').decision).toBe('Generation & Storage Investment');
    expect(searchToFilters('?decision=Other+%2F+General+Modeling').decision).toBe('Not specified');
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

  it('writes the grid decision and impact filters', () => {
    const f = { ...DEFAULT_FILTERS, decision: 'Transmission & Distribution Planning', impact: 'high' };
    expect(searchToFilters(filtersToSearch(f))).toEqual(f);
    expect(filtersToSearch(f)).toContain('impact=high');
  });

  it('round-trips several values in one filter', () => {
    const f = { ...DEFAULT_FILTERS, country: 'Spain|France', toolName: 'PyPSA|PLEXOS' };
    expect(searchToFilters(filtersToSearch(f))).toEqual(f);
  });

  it('reads links made before a tool was renamed', () => {
    expect(searchToFilters('?tool=PyPSA|DIgSILENT+PowerFactory').toolName).toBe('PyPSA|PowerFactory');
  });
});
