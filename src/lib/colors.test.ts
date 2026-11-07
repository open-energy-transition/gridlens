import { describe, it, expect } from 'vitest';
import { bucketIndexFor, mapColorFor, MAP_NO_DATA, MAP_SCALE } from './colors';

// Regression tests for the choropleth bug fixed on 7 Nov 2026: a linear
// value/max ratio crushed every low-but-nonzero country into the same
// near-black bucket as "no data". These tests pin the sqrt-scale behavior
// so that bug can't silently come back.
describe('bucketIndexFor', () => {
  it('returns -1 (no data) for zero, negative, or missing values', () => {
    expect(bucketIndexFor(0, 64)).toBe(-1);
    expect(bucketIndexFor(-1, 64)).toBe(-1);
    expect(bucketIndexFor(5, 0)).toBe(-1);
    expect(bucketIndexFor(NaN, 64)).toBe(-1);
  });

  it('gives a low-but-nonzero value a bucket clearly above the lowest, not bucket 0', () => {
    // This is the exact regression case: with max=64 (a realistic country
    // record-count spread), a country with just 1 record must NOT land in
    // the same bucket as having 0 records.
    const idx = bucketIndexFor(1, 64);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(mapColorFor(1, 64)).not.toBe(MAP_NO_DATA);
  });

  it('the highest value always lands in the last (brightest) bucket', () => {
    expect(bucketIndexFor(64, 64)).toBe(MAP_SCALE.length - 1);
  });

  it('is monotonic: a higher value never yields a lower bucket index', () => {
    const max = 149;
    let prevIdx = -1;
    for (let v = 1; v <= max; v++) {
      const idx = bucketIndexFor(v, max);
      expect(idx).toBeGreaterThanOrEqual(prevIdx);
      prevIdx = idx;
    }
  });
});

describe('mapColorFor', () => {
  it('returns MAP_NO_DATA for no data, and a MAP_SCALE color otherwise', () => {
    expect(mapColorFor(0, 64)).toBe(MAP_NO_DATA);
    expect(MAP_SCALE).toContain(mapColorFor(32, 64));
  });
});
