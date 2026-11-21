import type { CatalogueRecord, ProjectOrg } from '../types';
import { orgGroup } from './orgTypes';
import { impactOf, projectImpact } from './impact';
import { isOpenSource, TOOLS } from './tools';

/** Grid decision types in display order; the catch-all comes last. */
export const DECISION_TYPES = [
  'Capacity & Resource Planning',
  'Transmission & Network Planning',
  'Market Operations & Price Formation',
  'Unit Commitment & Dispatch',
  'Renewable Integration & Decarbonization',
  'Policy & Regulatory Analysis',
  'Forecasting & Scenario Analysis',
  'Independent & Commissioned Studies',
  'Academic & Research Studies',
  'Other / General Modeling',
];

export const OTHER_DECISION = 'Other / General Modeling';

/** Plain-language name and meaning of each grid decision type. */
export const DECISION_INFO: Record<string, { short: string; description: string }> = {
  'Capacity & Resource Planning': { short: 'Capacity planning', description: 'Which power plants and storage to build, and whether there will be enough supply in the long run.' },
  'Transmission & Network Planning': { short: 'Grid planning', description: 'Where to expand the grid, build interconnectors, and connect new plants.' },
  'Market Operations & Price Formation': { short: 'Markets & prices', description: 'How wholesale markets clear, what prices result, and how markets should be designed.' },
  'Unit Commitment & Dispatch': { short: 'Operations', description: 'Which plants run hour by hour, and how the system is operated day to day.' },
  'Renewable Integration & Decarbonization': { short: 'Renewables & net zero', description: 'How to integrate wind and solar, and pathways to a decarbonized system.' },
  'Policy & Regulatory Analysis': { short: 'Policy & regulation', description: 'Energy policy, regulatory reviews and national energy plans.' },
  'Forecasting & Scenario Analysis': { short: 'Forecasts & scenarios', description: 'Demand and supply forecasts, and long-term scenarios.' },
  'Independent & Commissioned Studies': { short: 'Commissioned studies', description: 'Studies by consultancies, usually for a grid operator, regulator or ministry, without a narrower stated purpose.' },
  'Academic & Research Studies': { short: 'Research', description: 'Studies by universities and research institutes.' },
  'Other / General Modeling': { short: 'Not specified', description: 'The source names the tool but not the decision it informed, so the project cannot be classified.' },
};

export function decisionOf(r: CatalogueRecord): string {
  return r.decision_type || OTHER_DECISION;
}

/** Projects per tool and decision type: "which tools are used for which purpose". */
export function purposeMatrix(records: CatalogueRecord[], includeOther = false) {
  const tools = new Map<string, Map<string, number>>();
  for (const r of records) {
    const d = decisionOf(r);
    if (!includeOther && d === OTHER_DECISION) continue;
    if (!tools.has(r.tool_name)) tools.set(r.tool_name, new Map());
    const row = tools.get(r.tool_name)!;
    row.set(d, (row.get(d) ?? 0) + 1);
  }
  const decisions = DECISION_TYPES.filter((d) => (includeOther || d !== OTHER_DECISION) && [...tools.values()].some((m) => m.has(d)));
  const rows = [...tools]
    .map(([tool, m]) => ({ tool, total: [...m.values()].reduce((a, b) => a + b, 0), counts: decisions.map((d) => m.get(d) ?? 0) }))
    .sort((a, b) => b.total - a.total || a.tool.localeCompare(b.tool));
  return { decisions, rows, max: Math.max(1, ...rows.flatMap((r) => r.counts)) };
}

/** Dated projects per year, split by open-source and proprietary tools. Undated projects are left out. */
export function projectsPerYear(records: CatalogueRecord[], from: number, to: number) {
  const years = Array.from({ length: to - from + 1 }, (_, i) => ({ year: from + i, open: 0, proprietary: 0 }));
  for (const r of records) {
    if (!r.year || r.year < from || r.year > to) continue;
    const y = years[r.year - from];
    if (isOpenSource(r.tool_name)) y.open += 1;
    else y.proprietary += 1;
  }
  return years;
}

/** Share of open-source projects among dated projects in [from, to]; null when there are none. */
export function openShare(records: CatalogueRecord[], from: number, to: number): number | null {
  const dated = records.filter((r) => r.year && r.year >= from && r.year <= to);
  return dated.length ? dated.filter((r) => isOpenSource(r.tool_name)).length / dated.length : null;
}

export interface OrgEntry {
  name: string;
  group: string;
  /** Countries of its projects, most frequent first (where it worked, not necessarily where it is based). */
  countries: string[];
  website: string;
  tools: string[];
  projects: number;
  /** Projects in which this organization was a decision-maker (grid operator, utility, regulator, ministry). */
  decisionProjects: number;
  latestYear: number | null;
  /** Source of its most recent project: a quick link when the website is unknown. */
  latestSource: string;
}

/** One entry per organization, most projects first. */
export function organizationDirectory(records: CatalogueRecord[]): OrgEntry[] {
  const byName = new Map<string, OrgEntry & { toolSet: Set<string>; latest: number; countryCounts: Map<string, number> }>();
  for (const r of records) {
    for (const o of r.organizations) {
      let e = byName.get(o.name);
      if (!e) {
        e = { name: o.name, group: orgGroup(o), countries: [], website: '', tools: [], toolSet: new Set(), projects: 0,
          decisionProjects: 0, latestYear: null, latestSource: '', latest: -1, countryCounts: new Map() };
        byName.set(o.name, e);
      }
      e.projects += 1;
      e.toolSet.add(r.tool_name);
      if (o.country_label) e.countryCounts.set(o.country_label, (e.countryCounts.get(o.country_label) ?? 0) + 1);
      if (!e.website && o.website) e.website = o.website;
      if (impactOf(o) === 'high') e.decisionProjects += 1;
      const y = r.year ?? 0;
      if (y > e.latest && r.sources[0]?.link) {
        e.latest = y;
        e.latestYear = r.year ?? null;
        e.latestSource = r.sources[0].link.trim();
      }
    }
  }
  return [...byName.values()]
    .map(({ toolSet, latest: _latest, countryCounts, ...e }) => ({
      ...e,
      countries: [...countryCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c),
      tools: [...toolSet].sort(),
    }))
    .sort((a, b) => b.projects - a.projects || a.name.localeCompare(b.name));
}

/**
 * Companies that deliver modelling with a tool: consultancies and vendors, ranked by projects.
 * `tool` limits to one tool; `openOnly` to open-source tools. Vendors of a tool are not counted
 * as its service providers (the tool's own maker is shown on its profile instead).
 */
export function serviceProviders(records: CatalogueRecord[], opts: { tool?: string; openOnly?: boolean } = {}) {
  const vendors = new Set(TOOLS.map((t) => t.vendor));
  const scoped = records.filter((r) => (!opts.tool || r.tool_name === opts.tool) && (!opts.openOnly || isOpenSource(r.tool_name)));
  const isProvider = (o: ProjectOrg) => orgGroup(o) === 'consultancy' && !vendors.has(o.name);
  const providerRecords = scoped
    .map((r) => ({ ...r, organizations: r.organizations.filter(isProvider) }))
    .filter((r) => r.organizations.length);
  return organizationDirectory(providerRecords);
}

export interface ToolStats {
  name: string;
  projects: number;
  organizations: number;
  countries: number;
  /** Distinct decision-making organizations (grid operators, utilities, regulators, ministries). */
  decisionMakers: number;
  gridOperators: number;
  highImpactProjects: number;
  recentProjects: number;
  firstYear: number | null;
  lastYear: number | null;
  topDecisions: { name: string; count: number }[];
  perYear: number[];
}

/** Evidence of adoption per tool, for the tool directory and profiles. */
export function toolStats(records: CatalogueRecord[], thisYear = new Date().getFullYear()): ToolStats[] {
  const from = thisYear - 9;
  return TOOLS.map((t) => {
    const rs = records.filter((r) => r.tool_name === t.name);
    const orgs = new Map(rs.flatMap((r) => r.organizations).map((o) => [o.name, o]));
    const years = rs.map((r) => r.year).filter((y): y is number => !!y);
    const decisions = new Map<string, number>();
    for (const r of rs) {
      const d = decisionOf(r);
      if (d !== OTHER_DECISION) decisions.set(d, (decisions.get(d) ?? 0) + 1);
    }
    const perYear = Array.from({ length: 10 }, (_, i) => rs.filter((r) => r.year === from + i).length);
    return {
      name: t.name,
      projects: rs.length,
      organizations: orgs.size,
      countries: new Set(rs.flatMap((r) => r.countries)).size,
      decisionMakers: [...orgs.values()].filter((o) => impactOf(o) === 'high').length,
      gridOperators: [...orgs.values()].filter((o) => orgGroup(o) === 'grid_operator').length,
      highImpactProjects: rs.filter((r) => projectImpact(r) === 'high').length,
      recentProjects: rs.filter((r) => r.year && r.year > thisYear - 5).length,
      firstYear: years.length ? Math.min(...years) : null,
      lastYear: years.length ? Math.max(...years) : null,
      topDecisions: [...decisions].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 3),
      perYear,
    };
  }).sort((a, b) => b.organizations - a.organizations || a.name.localeCompare(b.name));
}
