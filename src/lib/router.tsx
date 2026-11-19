import { useCallback, useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';

/** Pages of the site. The overview is the one-pager; the rest hold detail and reference material. */
export const PAGES = [
  { path: '/', label: 'Overview', title: "GridLens — who uses which energy models, where, for which grid decisions" },
  { path: '/tools', label: 'Tools', title: 'Tools · GridLens' },
  { path: '/organizations', label: 'Organizations', title: 'Organizations · GridLens' },
  { path: '/projects', label: 'Projects & data', title: 'Projects & data · GridLens' },
  { path: '/methodology', label: 'Methodology', title: 'About & methodology · GridLens' },
  { path: '/changelog', label: 'Changelog', title: 'Changelog · GridLens' },
] as const;

export type PagePath = (typeof PAGES)[number]['path'];

/** Sections of the overview, in page order: the left-hand index and the chart ids. */
export const SECTIONS = [
  { id: 'adoption', label: 'Adoption' },
  { id: 'purpose', label: 'Tools by purpose' },
  { id: 'momentum', label: 'Momentum' },
  { id: 'map', label: 'Where' },
  { id: 'decisions', label: 'Grid decisions' },
  { id: 'providers', label: 'Who can help' },
] as const;

/** Every filterable chart on any page. */
export const CHART_IDS = ['adoption', 'purpose', 'momentum', 'map', 'decisions', 'providers', 'projects'];

/** URL-safe tool name: "PSS/E" → "pss-e", "DIgSILENT PowerFactory" → "digsilent-powerfactory". */
export function slug(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface Route {
  page: PagePath;
  /** Tool profile: /tools/<slug>. */
  tool?: string;
}

/**
 * Route for a path. Pages from earlier versions of the site keep working:
 * they lead to the section or page that now holds their content.
 */
export function parsePath(pathname: string): { route: Route; hash?: string } {
  const p = pathname.replace(/\/+$/, '') || '/';
  const tool = p.match(/^\/(?:tools|top-users)\/(.+)$/);
  if (tool) return { route: { page: '/tools', tool: slug(decodeURIComponent(tool[1])) } };
  if (PAGES.some((pg) => pg.path === p)) return { route: { page: p as PagePath } };
  const legacy: Record<string, { route: Route; hash?: string }> = {
    '/grid-decisions': { route: { page: '/' }, hash: 'decisions' },
    '/geographic': { route: { page: '/' }, hash: 'map' },
    '/top-users': { route: { page: '/tools' } },
    '/institutions': { route: { page: '/organizations' } },
    '/records': { route: { page: '/projects' } },
    '/about': { route: { page: '/methodology' } },
  };
  return legacy[p] ?? { route: { page: '/' } };
}

export function routePath(route: Route): string {
  return route.tool ? `/tools/${route.tool}` : route.page;
}

const listeners = new Set<() => void>();

/** Go to an internal path (with optional query/hash) without reloading. */
export function navigate(href: string) {
  window.history.pushState(null, '', href);
  listeners.forEach((l) => l());
  const hash = new URL(href, window.location.origin).hash.slice(1);
  if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }));
  else window.scrollTo(0, 0);
}

/** The current route; old paths are rewritten in the address bar to their new home. */
export function useRoute(): Route {
  const read = useCallback(() => {
    const { route, hash } = parsePath(window.location.pathname);
    const canonical = routePath(route);
    if (canonical !== window.location.pathname || (hash && !window.location.hash)) {
      window.history.replaceState(null, '', canonical + window.location.search + (hash ? `#${hash}` : window.location.hash));
    }
    return route;
  }, []);
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const update = () => setRoute(read());
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
  }, [read]);
  return route;
}

/** In-app link: a normal <a href> (so it can be opened in a new tab), navigated without a reload. */
export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href);
  }
  return <a href={href} onClick={handle} {...rest} />;
}
