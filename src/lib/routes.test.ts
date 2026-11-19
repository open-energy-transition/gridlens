import { describe, it, expect } from 'vitest';
import { legacyRoute, SECTIONS, CHART_IDS } from './routes';

describe('legacyRoute', () => {
  it('maps the old pages to their section', () => {
    expect(legacyRoute('/grid-decisions')).toEqual({ section: 'decisions' });
    expect(legacyRoute('/geographic/')).toEqual({ section: 'map' });
    expect(legacyRoute('/records')).toEqual({ section: 'projects' });
  });

  it('keeps the tool of /top-users/<tool>', () => {
    expect(legacyRoute('/top-users/PSS%2FE')).toEqual({ section: 'top-users', tool: 'PSS/E' });
  });

  it('returns null for the home page and unknown paths', () => {
    expect(legacyRoute('/')).toBeNull();
    expect(legacyRoute('/nope')).toBeNull();
  });

  it('only lists charts that are sections', () => {
    const ids = SECTIONS.map((s) => s.id as string);
    expect(CHART_IDS.every((c) => ids.includes(c))).toBe(true);
  });
});
