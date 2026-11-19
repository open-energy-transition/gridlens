import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CatalogueRecord, Filters } from '../types';
import { EMPTY_FILTERS } from '../types';
import { applyFilters, uniqSorted } from './filters';
import { splitCategories, TOOL_CATEGORIES } from './toolCategories';
import { orgGroup, ORG_GROUPS } from './orgTypes';
import { mergeChartSearch, searchToChartFilters, type ChartFilters } from './filterParams';

/** Choices offered in every chart's filter panel. */
export interface FilterOptions {
  countries: string[];
  toolNames: string[];
  toolCategories: string[];
  evidenceStrengths: string[];
  orgTypes: string[];
  sourceGroups: string[];
}

interface ChartState {
  catalogue: CatalogueRecord[];
  options: FilterOptions;
  filters: ChartFilters;
  setFilters: (id: string, f: Filters) => void;
}

const Ctx = createContext<ChartState | null>(null);

function optionsFor(catalogue: CatalogueRecord[]): FilterOptions {
  const present = new Set(catalogue.flatMap((r) => splitCategories(r.tool_category)));
  const groups = new Set(catalogue.map(orgGroup));
  return {
    countries: [...new Set(catalogue.flatMap((r) => r.countries))].sort((a, b) => a.localeCompare(b)),
    toolNames: uniqSorted(catalogue, 'tool_name'),
    toolCategories: TOOL_CATEGORIES.map((c) => c.id).filter((id) => present.has(id)),
    evidenceStrengths: uniqSorted(catalogue, 'evidence_strength'),
    orgTypes: ORG_GROUPS.map((g) => g.id).filter((id) => groups.has(id)),
    sourceGroups: ['industry', 'academic'].filter((g) => catalogue.some((r) => r.source_group === g)),
  };
}

/**
 * Holds the filters of every chart on the page and mirrors them in the URL
 * (`?decisions.country=Spain`), so a copied link restores each chart's selection.
 * `legacyChart` receives unprefixed filters from older links (e.g. /grid-decisions?country=Spain).
 */
export function ChartFiltersProvider({ catalogue, chartIds, legacyChart, children }: {
  catalogue: CatalogueRecord[]; chartIds: string[]; legacyChart?: string; children: ReactNode;
}) {
  const options = useMemo(() => optionsFor(catalogue), [catalogue]);
  const [filters, setAll] = useState<ChartFilters>(() => searchToChartFilters(window.location.search, chartIds, legacyChart));

  useEffect(() => {
    const search = mergeChartSearch(window.location.search, filters, !!legacyChart);
    if (search !== window.location.search) {
      window.history.replaceState(window.history.state, '', window.location.pathname + search + window.location.hash);
    }
  }, [filters, legacyChart]);

  useEffect(() => {
    const onPop = () => setAll(searchToChartFilters(window.location.search, chartIds));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [chartIds]);

  const setFilters = useCallback((id: string, f: Filters) => setAll((s) => ({ ...s, [id]: f })), []);
  const value = useMemo(() => ({ catalogue, options, filters, setFilters }), [catalogue, options, filters, setFilters]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The filters of one chart and the projects they select. */
export function useChart(id: string) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useChart needs a ChartFiltersProvider');
  const filters = ctx.filters[id] ?? EMPTY_FILTERS;
  const records = useMemo(() => applyFilters(ctx.catalogue, filters), [ctx.catalogue, filters]);
  const setFilters = useCallback((f: Filters) => ctx.setFilters(id, f), [ctx, id]);
  return { id, filters, setFilters, records, catalogue: ctx.catalogue, options: ctx.options };
}
