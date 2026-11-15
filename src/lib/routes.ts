import { useState, useEffect, useCallback } from 'react';
import type { Section } from '../types';

const ROUTE_MAP: Record<string, Section> = {
  '': 'overview', '/': 'overview',
  '/geographic': 'geographic', '/tools': 'tools',
  '/grid-decisions': 'decisions', '/institutions': 'institutions',
  '/top-users': 'top-users', '/records': 'records',
  '/about': 'about', '/changelog': 'changelog',
};

const TITLE_MAP: Record<Section, string> = {
  overview: "GridLens — See who's using which energy models, where",
  geographic: 'Geographic Analysis · GridLens',
  tools: 'Tools & Categories · GridLens',
  decisions: 'Grid Decisions · GridLens',
  institutions: 'Institutions · GridLens',
  'top-users': 'Top Users by Tool · GridLens',
  records: 'Records & Export · GridLens',
  about: 'About · GridLens',
  changelog: 'Changelog · GridLens',
};

const SECTION_PATHS: Record<Section, string> = {
  overview: '/', geographic: '/geographic', tools: '/tools',
  decisions: '/grid-decisions', institutions: '/institutions',
  'top-users': '/top-users', records: '/records', about: '/about',
  changelog: '/changelog',
};

function norm(p: string): string { return p.replace(/\/+$/, '') || '/'; }

export function routeToPath(section: Section, tool?: string): string {
  if (section === 'top-users' && tool) return `/top-users/${encodeURIComponent(tool)}`;
  return SECTION_PATHS[section] ?? '/';
}

export function pathToRoute(pathname: string): { section: Section; tool?: string } {
  const p = norm(pathname);
  if (ROUTE_MAP[p]) return { section: ROUTE_MAP[p] };
  if (p.startsWith('/top-users/')) {
    const t = decodeURIComponent(p.slice('/top-users/'.length));
    if (t) return { section: 'top-users', tool: t };
  }
  return { section: 'overview' };
}

export function getPageTitle(section: Section): string {
  return TITLE_MAP[section];
}

export function useRoute() {
  const init = pathToRoute(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [section, setSection] = useState<Section>(init.section);
  const [tool, setTool] = useState<string | undefined>(init.tool);

  const handleRoute = useCallback((pathname: string) => {
    const { section: s, tool: t } = pathToRoute(pathname);
    // Unknown path → replace with overview (per spec)
    if (s === 'overview' && !t && norm(pathname) !== '/' && norm(pathname) !== '') {
      window.history.replaceState({}, '', '/');
      setSection('overview');
      setTool(undefined);
    } else {
      setSection(s);
      setTool(t);
    }
  }, []);

  useEffect(() => {
    const h = () => handleRoute(window.location.pathname);
    window.addEventListener('popstate', h);
    return () => window.removeEventListener('popstate', h);
  }, [handleRoute]);

  const navigateTo = useCallback((s: Section, t?: string) => {
    const p = routeToPath(s, t);
    window.history.pushState({}, '', p);
    setSection(s);
    setTool(t);
  }, []);

  return { section, tool, navigateTo };
}
