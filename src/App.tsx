import { useEffect, useMemo, type ReactNode } from 'react';
import { LayoutDashboard, Building2, Globe2, Wrench } from 'lucide-react';
import catalogueData from './data/catalogue.json';
import type { CatalogueRecord } from './types';
import { uniqueCount } from './lib/filters';
import { CHART_IDS, legacyRoute } from './lib/routes';
import { ChartFiltersProvider } from './lib/chartFilters';
import { activeCount, searchToFilters } from './lib/filterParams';
import SectionNav from './components/layout/SectionNav';
import KpiCard from './components/kpi/KpiCard';
import Hero from './components/common/Hero';
import AdoptionRanking from './components/common/AdoptionRanking';
import Domains from './sections/Domains';
import Geographic from './sections/Geographic';
import GridDecisions from './sections/GridDecisions';
import TopUsersByTool from './sections/TopUsersByTool';
import Institutions from './sections/Institutions';
import Evidence from './sections/Evidence';
import RecordsExport from './sections/RecordsExport';
import ChangelogPage from './sections/ChangelogPage';
import About from './sections/About';
import Footer from './components/layout/Footer';

const catalogue = catalogueData as CatalogueRecord[];

/**
 * Links from before the one-page layout (/grid-decisions?country=Spain, /top-users/PLEXOS) become
 * /#decisions with that chart's filters. Runs once, before the filters are read from the URL.
 */
const legacy = legacyRoute(window.location.pathname);
if (legacy) {
  const params = new URLSearchParams(window.location.search);
  if (legacy.tool) params.set('tool', legacy.tool);
  const s = params.toString();
  window.history.replaceState(null, '', `/${s ? `?${s}` : ''}#${legacy.section}`);
} else if (window.location.pathname !== '/') {
  window.history.replaceState(null, '', `/${window.location.search}${window.location.hash}`);
}

function Section({ id, children }: { id: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-16">{children}</section>;
}

export default function App() {
  // Unprefixed filters (old links) belong to the section the old link pointed at.
  const legacyChart = legacy && activeCount(searchToFilters(window.location.search)) > 0 ? legacy.section : undefined;

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, []);

  const kpis = useMemo(() => ({
    countries: new Set(catalogue.flatMap((r) => r.countries)).size,
    institutions: new Set(catalogue.flatMap((r) => r.organizations.map((o) => o.name))).size,
    tools: uniqueCount(catalogue, 'tool_name'),
  }), []);

  return (
    <ChartFiltersProvider catalogue={catalogue} chartIds={CHART_IDS} legacyChart={legacyChart}>
      <div className="min-h-screen bg-ink-950 text-ink-100">
        <SectionNav />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:space-y-8 md:px-8">
          <Hero />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard icon={LayoutDashboard} label="Projects" value={catalogue.length} />
            <KpiCard icon={Globe2} label="Countries" value={kpis.countries} />
            <KpiCard icon={Building2} label="Institutions" value={kpis.institutions} />
            <KpiCard icon={Wrench} label="Tools" value={kpis.tools} />
          </div>
          <Section id="adoption"><AdoptionRanking /></Section>
          <Section id="domains"><Domains /></Section>
          <Section id="map"><Geographic /></Section>
          <Section id="decisions"><GridDecisions /></Section>
          <Section id="top-users"><TopUsersByTool /></Section>
          <Section id="institutions"><Institutions /></Section>
          <Section id="evidence"><Evidence /></Section>
          <Section id="projects"><RecordsExport /></Section>
          <Section id="changelog"><ChangelogPage /></Section>
          <Section id="about"><About /></Section>
        </main>
        <Footer />
      </div>
    </ChartFiltersProvider>
  );
}
