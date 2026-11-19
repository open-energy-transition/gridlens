import { describe, expect, it } from 'vitest';
import { filtersToSearch, mergeChartSearch, searchToChartFilters, searchToFilters } from './filterParams';
import { EMPTY_FILTERS } from '../types';

describe('filter query string', () => {
  it('is empty without filters', () => {
    expect(filtersToSearch(EMPTY_FILTERS)).toBe('');
    expect(searchToFilters('')).toEqual(EMPTY_FILTERS);
  });

  it('round-trips active filters, including spaces and special characters', () => {
    const f = { ...EMPTY_FILTERS, country: 'Bosnia and Herzegovina', toolName: 'PSS/E', orgType: 'grid_operator', sector: 'industry', period: '5', search: 'TYNDP & flex' };
    const s = filtersToSearch(f);
    expect(s).toBe('?country=Bosnia+and+Herzegovina&tool=PSS%2FE&org=grid_operator&sector=industry&years=5&q=TYNDP+%26+flex');
    expect(searchToFilters(s)).toEqual(f);
  });

  it('ignores unknown keys', () => {
    expect(searchToFilters('?country=Spain&utm_source=x')).toEqual({ ...EMPTY_FILTERS, country: 'Spain' });
  });
});

describe('per-chart filters in the URL', () => {
  it('keeps each chart apart and restores it', () => {
    const state = { decisions: { ...EMPTY_FILTERS, country: 'Spain' }, map: { ...EMPTY_FILTERS, toolName: 'PyPSA' } };
    const s = mergeChartSearch('', state, false);
    expect(s).toBe('?decisions.country=Spain&map.tool=PyPSA');
    expect(searchToChartFilters(s, ['decisions', 'map'])).toEqual(state);
  });

  it('gives old unprefixed filters to the chart the old link pointed at, then drops them', () => {
    const state = searchToChartFilters('?country=Spain', ['decisions', 'map'], 'decisions');
    expect(state.decisions.country).toBe('Spain');
    expect(state.map.country).toBe('All');
    expect(mergeChartSearch('?country=Spain', state, true)).toBe('?decisions.country=Spain');
  });

  it('leaves other parameters of the page alone', () => {
    expect(mergeChartSearch('?type=consultancy&tool=PyPSA', { decisions: EMPTY_FILTERS }, false)).toBe('?type=consultancy&tool=PyPSA');
  });
});
