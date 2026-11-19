/** Sections of the one-page layout, in page order. The id is the anchor (#decisions) and the chart id. */
export const SECTIONS = [
  { id: 'adoption', label: 'Adoption' },
  { id: 'domains', label: 'Domains' },
  { id: 'map', label: 'Map' },
  { id: 'decisions', label: 'Grid decisions' },
  { id: 'top-users', label: 'Top users' },
  { id: 'institutions', label: 'Institutions' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'projects', label: 'Projects' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'about', label: 'About' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** Sections that have a filterable chart. */
export const CHART_IDS: string[] = ['adoption', 'domains', 'map', 'decisions', 'top-users', 'institutions', 'evidence', 'projects'];

/** Pages from before the one-page layout, and the section each now scrolls to. */
const LEGACY: Record<string, SectionId> = {
  '/geographic': 'map',
  '/tools': 'domains',
  '/grid-decisions': 'decisions',
  '/institutions': 'institutions',
  '/top-users': 'top-users',
  '/records': 'projects',
  '/about': 'about',
  '/changelog': 'changelog',
};

/**
 * Where an old page link points: the section, plus the tool of /top-users/<tool>.
 * Returns null for "/" and unknown paths.
 */
export function legacyRoute(pathname: string): { section: SectionId; tool?: string } | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (LEGACY[p]) return { section: LEGACY[p] };
  if (p.startsWith('/top-users/')) {
    const tool = decodeURIComponent(p.slice('/top-users/'.length));
    return tool ? { section: 'top-users', tool } : { section: 'top-users' };
  }
  return null;
}
