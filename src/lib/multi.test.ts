import { describe, expect, it } from 'vitest';
import { joinValues, matcher, single, toggleValue, valuesOf } from './multi';

describe('multi-value filters', () => {
  it('toggle values in and out; none left is All', () => {
    expect(toggleValue('All', 'Spain')).toBe('Spain');
    expect(toggleValue('Spain', 'France')).toBe('Spain|France');
    expect(toggleValue('Spain|France', 'Spain')).toBe('France');
    expect(toggleValue('France', 'France')).toBe('All');
    expect(valuesOf('All')).toEqual([]);
    expect(joinValues(['A', 'A', ''])).toBe('A');
  });

  it('match any chosen value; All matches everything', () => {
    expect(matcher('A|B')('B')).toBe(true);
    expect(matcher('A|B')('C')).toBe(false);
    expect(matcher('All')('C')).toBe(true);
    expect(single('A')).toBe('A');
    expect(single('A|B')).toBeUndefined();
  });
});
