import { useMemo, useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Globe2, Wrench } from 'lucide-react';
import catalogueData from './data/catalogue.json';
import type { CatalogueRecord, Filters, Section } from './types';
import { EMPTY_FILTERS } from './types';
import { applyFilters, uniqSorted, uniqueCount } from './lib/filters';
import { splitCategories, TOOL_CATEGORIES } from './lib/toolCategories';
import { orgGroup, ORG_GROUPS } from './lib/orgTypes';
import { useRoute, getPageTitle } from './lib/routes';
import Sidebar from './components/layout/Sidebar';
import FilterBar from './components/layout/FilterBar';
import KpiCard from './components/kpi/KpiCard';
import Hero from './components/common/Hero';
import Overview from './sections/Overview';
import Geographic from './sections/Geographic';
import ToolsAndCategories from './sections/ToolsAndCategories';
import GridDecisions from './sections/GridDecisions';
import Institutions from './sections/Institutions';
import TopUsersByTool from './sections/TopUsersByTool';
import RecordsExport from './sections/RecordsExport';
import About from './sections/About';
import ChangelogPage from './sections/ChangelogPage';
import Footer from './components/layout/Footer';

const catalogue = catalogueData as CatalogueRecord[];

export default function App() {
  const { section, tool, navigateTo } = useRoute();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const countries = useMemo(() => uniqSorted(catalogue, 'country_label'), []);
  const toolNames = useMemo(() => uniqSorted(catalogue, 'tool_name'), []);
  const toolCategories = useMemo(() => {
    const present = new Set(catalogue.flatMap((r) => splitCategories(r.tool_category)));
    return TOOL_CATEGORIES.map((c) => c.id).filter((id) => present.has(id));
  }, []);
  const evidenceStrengths = useMemo(() => uniqSorted(catalogue, 'evidence_strength'), []);
  const orgTypes = useMemo(() => {
    const present = new Set(catalogue.map(orgGroup));
    return ORG_GROUPS.map((g) => g.id).filter((id) => present.has(id));
  }, []);
  const sourceGroups = useMemo(() => ['industry', 'academic'].filter((g) => catalogue.some((r) => r.source_group === g)), []);

  const filtered = useMemo(() => applyFilters(catalogue, filters), [filters]);

  function handleSelectSection(s: Section) {
    navigateTo(s);
    setSidebarOpen(false);
  }

  const isStaticPage = section === 'about' || section === 'changelog';

  // Update page title and scroll to top on navigation
  useEffect(() => {
    document.title = getPageTitle(section);
    window.scrollTo(0, 0);
  }, [section]);

  return (
    <div className="flex min-h-screen bg-ink-950 text-ink-100">
      <Sidebar active={section} onSelect={handleSelectSection} open={sidebarOpen} recordCount={catalogue.length} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}
      <div className="flex min-h-screen flex-1 flex-col">
        {!isStaticPage && (
          <FilterBar
            filters={filters}
            onChange={setFilters}
            countries={countries}
            toolNames={toolNames}
            toolCategories={toolCategories}
            evidenceStrengths={evidenceStrengths}
            orgTypes={orgTypes}
            sourceGroups={sourceGroups}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            resultCount={filtered.length}
            totalCount={catalogue.length}
          />
        )}
        <main className="flex-1 px-4 py-6 md:px-8">
          {section === 'overview' && <Hero />}

          {!isStaticPage && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={LayoutDashboard}
                label="Applications"
                value={filtered.length}
                context={`of ${catalogue.length} total`}
              />
              <KpiCard icon={Globe2} label="Countries" value={uniqueCount(filtered, 'country_label')} />
              <KpiCard icon={Building2} label="Institutions" value={uniqueCount(filtered, 'institution_name')} />
              <KpiCard icon={Wrench} label="Tools" value={uniqueCount(filtered, 'tool_name')} />
            </div>
          )}

          {section === 'overview' && <Overview records={filtered} onNavigate={handleSelectSection} />}
          {section === 'geographic' && <Geographic records={filtered} />}
          {section === 'tools' && <ToolsAndCategories records={filtered} />}
          {section === 'decisions' && <GridDecisions records={filtered} />}
          {section === 'institutions' && <Institutions records={filtered} />}
          {section === 'top-users' && <TopUsersByTool allRecords={catalogue} tool={tool} onToolChange={(t) => navigateTo('top-users', t)} />}
          {section === 'records' && <RecordsExport records={filtered} />}
          {section === 'about' && <About />}
          {section === 'changelog' && <ChangelogPage />}
        </main>
        <Footer />
      </div>
    </div>
  );
}
