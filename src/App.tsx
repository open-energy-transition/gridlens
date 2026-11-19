import { useEffect } from 'react';
import catalogueData from './data/catalogue.json';
import type { CatalogueRecord } from './types';
import { CHART_IDS, PAGES, parsePath, routePath, slug, useRoute } from './lib/router';
import { TOOLS } from './lib/tools';
import { ChartFiltersProvider } from './lib/chartFilters';
import { activeCount, searchToFilters } from './lib/filterParams';
import Shell from './components/layout/Shell';
import Overview from './pages/Overview';
import Tools from './pages/Tools';
import Organizations from './pages/Organizations';
import Projects from './pages/Projects';
import Methodology from './pages/Methodology';
import Changelog from './pages/Changelog';

const catalogue = catalogueData as CatalogueRecord[];

/**
 * Unprefixed filters come from links made before each chart had its own filters
 * (/grid-decisions?country=Spain): they apply to the chart that link pointed at.
 */
const first = parsePath(window.location.pathname);
const legacyChart = activeCount(searchToFilters(window.location.search)) > 0
  ? first.hash ?? (first.route.page === '/projects' ? 'projects' : undefined)
  : undefined;

export default function App() {
  const route = useRoute();

  useEffect(() => {
    const page = PAGES.find((p) => p.path === route.page)!;
    const tool = TOOLS.find((t) => slug(t.name) === route.tool)?.name;
    document.title = tool ? `${tool} · Tools · GridLens` : page.title;
  }, [route]);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  }, []);

  return (
    <ChartFiltersProvider catalogue={catalogue} chartIds={CHART_IDS} legacyChart={legacyChart}>
      <Shell route={route}>
        <div key={routePath(route)}>
          {route.page === '/' && <Overview catalogue={catalogue} />}
          {route.page === '/tools' && <Tools catalogue={catalogue} tool={route.tool} />}
          {route.page === '/organizations' && <Organizations catalogue={catalogue} />}
          {route.page === '/projects' && <Projects />}
          {route.page === '/methodology' && <Methodology catalogue={catalogue} />}
          {route.page === '/changelog' && <Changelog />}
        </div>
      </Shell>
    </ChartFiltersProvider>
  );
}
