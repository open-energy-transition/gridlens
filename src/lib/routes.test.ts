import { describe, it, expect } from 'vitest';
import { pathToRoute, routeToPath, getPageTitle } from './routes';
import type { Section } from '../types';

const SECTIONS: Section[] = [
  'overview', 'geographic', 'tools', 'decisions', 'institutions',
  'top-users', 'records', 'about', 'changelog',
];

describe('pathToRoute / routeToPath round-trips', () => {
  for (const section of SECTIONS) {
    it(`round-trips ${section}`, () => {
      const t = section === 'top-users' ? 'PLEXOS' : undefined;
      const path = routeToPath(section, t);
      const parsed = pathToRoute(path);
      expect(parsed.section).toBe(section);
      if (t) expect(parsed.tool).toBe(t);
    });
  }

  it('overview maps to /', () => {
    expect(routeToPath('overview')).toBe('/');
    expect(pathToRoute('/')).toEqual({ section: 'overview' });
  });

  it('trailing slash is tolerated', () => {
    expect(pathToRoute('/geographic/')).toEqual({ section: 'geographic' });
    expect(pathToRoute('/top-users/')).toEqual({ section: 'top-users' });
    expect(pathToRoute('/institutions/')).toEqual({ section: 'institutions' });
  });

  it('unknown paths default to overview', () => {
    expect(pathToRoute('/unknown')).toEqual({ section: 'overview' });
    expect(pathToRoute('/foo/bar/baz')).toEqual({ section: 'overview' });
  });

  it('/top-users/<tool> extracts tool', () => {
    expect(pathToRoute('/top-users/PyPSA')).toEqual({ section: 'top-users', tool: 'PyPSA' });
    expect(pathToRoute('/top-users/pypsa')).toEqual({ section: 'top-users', tool: 'pypsa' });
    expect(pathToRoute('/top-users/PLEXOS')).toEqual({ section: 'top-users', tool: 'PLEXOS' });
  });

  it('routeToPath encodes tool names with special chars', () => {
    const path = routeToPath('top-users', 'A/B C');
    expect(path).toBe('/top-users/A%2FB%20C');
    expect(pathToRoute(path).tool).toBe('A/B C');
  });
});

describe('getPageTitle', () => {
  it('returns the correct title for each section', () => {
    expect(getPageTitle('overview')).toBe("GridLens — See who's using which energy models, where");
    expect(getPageTitle('geographic')).toBe('Geographic Analysis · GridLens');
    expect(getPageTitle('about')).toBe('About · GridLens');
  });
});
