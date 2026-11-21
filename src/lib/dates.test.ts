import { describe, expect, it } from 'vitest';
import { formatDate } from './dates';

describe('study dates of mixed precision', () => {
  it('shows as much as is known', () => {
    expect(formatDate('2024-03-12')).toBe('12 Mar 2024');
    expect(formatDate('2024-03')).toBe('Mar 2024');
    expect(formatDate('2024')).toBe('2024');
  });

  it('falls back to the year and says when neither is known', () => {
    expect(formatDate(null, 2021)).toBe('2021');
    expect(formatDate(undefined, null)).toBe('Year unknown');
  });
});
