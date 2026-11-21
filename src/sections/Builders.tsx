import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AVAILABLE_METRICS, contributorsInWindow, CONTRIBUTORS, METRICS, type ContributorOrg, type Metric } from '../lib/contributors';
import Segmented from '../components/chart/Segmented';
import { Link, slug } from '../lib/router';
import { isOpenSource, TOOLS, toolInfo } from '../lib/tools';
import { useChart } from '../lib/chartFilters';
import { DEFAULT_FILTERS } from '../types';
import ChartCard from '../components/chart/ChartCard';
import EmptyState from '../components/common/EmptyState';
import ToolLogo from '../components/common/ToolLogo';

const OPEN_TOOLS = TOOLS.filter((t) => t.license === 'open_source' && CONTRIBUTORS.tools[t.name]).map((t) => t.name);
const SHOWN = 12;
/** The filter panel offers only the open-source tools with code data, and their categories. */
const CHOICES = {
  toolNames: OPEN_TOOLS,
  toolCategories: [...new Set(OPEN_TOOLS.flatMap((t) => toolInfo(t)!.categories))],
};

/** The caveat shown with every contribution ranking. */
export function ContributionCaveat() {
  return (
    <p className="mt-5 border-l-2 border-ink-700 pl-3 text-xs leading-relaxed text-ink-500">
      A hint, not a verdict. These counts cover only these GitHub organizations, and only people who name an organization
      on their GitHub profile. Documentation, teaching, user support, funding and the many upstream and downstream projects
      these tools depend on are not counted. Every contribution to open source is valuable.
    </p>
  );
}

/** The contribution window follows the shared study-year slider: the last N years, or all (as far back as GitHub goes). */
export function windowMonths(period: string): number {
  return period === 'All' ? 12 * 50 : 12 * Number(period);
}

/** Organizations ranked by pull requests merged in the window; each name links to the organization. */
export function ContributorBars({ orgs, showTools, limit = SHOWN, metric = 'prs' }: { orgs: ContributorOrg[]; showTools?: boolean; limit?: number; metric?: Metric }) {
  const unit = METRICS.find((m) => m.id === metric)!.unit;
  const [all, setAll] = useState(false);
  if (orgs.length === 0) return <EmptyState title="No contributions from named organizations in this period" message="Widen the time window." />;
  const shown = all ? orgs : orgs.slice(0, limit);
  const max = Math.max(1, ...orgs.map((o) => o.count));
  return (
    <>
      <ol className="group/list space-y-3 sm:space-y-1">
        {shown.map((o, i) => (
          <li key={o.name}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-lg px-2 py-1 transition-[opacity,background-color] hover:bg-ink-800/50 group-hover/list:opacity-50 hover:!opacity-100 sm:grid-cols-[minmax(12rem,20rem)_1fr_auto]">
            <span className="flex min-w-0 items-center gap-3 text-sm">
              <span className="tabular w-5 shrink-0 text-xs text-ink-600">{i + 1}</span>
              <span className="min-w-0">
                {o.url ? (
                  <a href={o.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-100 underline decoration-ink-700 underline-offset-4 hover:text-ink-50 hover:decoration-brand-500">
                    {o.name}<ArrowUpRight size={12} className="shrink-0 text-ink-500" />
                  </a>
                ) : <span className="text-ink-100">{o.name}</span>}
                {showTools && (
                  <span className="mt-0.5 flex flex-wrap gap-x-2">
                    {o.tools.map((t) => <Link key={t} href={`/tools/${slug(t)}`} className="text-[11px] text-ink-500 hover:text-ink-200">{t}</Link>)}
                  </span>
                )}
              </span>
            </span>
            <span className="tabular whitespace-nowrap text-right text-xs text-ink-400 sm:order-last sm:w-44 self-start sm:self-center">
              <span className="text-sm text-ink-100">{o.count.toLocaleString('en')}</span> <span className="hidden sm:inline">{unit} · {o.people} {o.people === 1 ? 'person' : 'people'}</span>
            </span>
            <div className="col-span-2 h-1.5 rounded-sm bg-ink-800/60 sm:col-span-1 sm:h-[18px]" aria-hidden="true">
              <div className="h-full rounded-sm bg-gradient-to-r from-brand-600 to-brand-400 transition-[width] duration-500" style={{ width: `${Math.max(1.5, (100 * o.count) / max)}%` }} />
            </div>
          </li>
        ))}
      </ol>
      {orgs.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-4 h-9 rounded-full border border-ink-700 px-4 text-xs text-ink-300 hover:text-ink-50">
          {all ? 'Show fewer' : `Show all ${orgs.length}`}
        </button>
      )}
    </>
  );
}

/** Where the counts come from, how people are attributed to organizations, and when the data was fetched. */
export function ContributionSource({ tools }: { tools: string[] }) {
  const orgs = tools.flatMap((t) => CONTRIBUTORS.tools[t]?.githubOrgs ?? []);
  const repos = tools.reduce((n, t) => n + (CONTRIBUTORS.tools[t]?.repositories ?? 0), 0);
  const people = tools.reduce((n, t) => n + (CONTRIBUTORS.tools[t]?.contributors ?? 0), 0);
  const named = tools.reduce((n, t) => n + (CONTRIBUTORS.tools[t]?.affiliated ?? 0), 0);
  return (
    <p className="mt-3 text-xs leading-relaxed text-ink-500">
      From {repos} repositories of{' '}
      {orgs.map((o, i) => (
        <span key={o}>{i > 0 && (i === orgs.length - 1 ? ' and ' : ', ')}<a className="text-ink-300 hover:text-ink-100" href={`https://github.com/${o}`} target="_blank" rel="noreferrer">github.com/{o}</a></span>
      ))}
      . {named} of {people} contributors name an organization on their GitHub profile; GridLens counts them for it.
      Updated {CONTRIBUTORS.generated}.
    </p>
  );
}

/** Which kind of contribution to rank by. */
export function MetricSwitch({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  if (AVAILABLE_METRICS.length < 2) return null;
  return <Segmented label="Count" value={value} onChange={(v) => onChange(v as Metric)} options={AVAILABLE_METRICS.map((m) => ({ id: m.id, label: m.label }))} />;
}

/**
 * Who builds the open-source tools: organizations ranked by their people's merged pull requests, commits, reviews
 * or issues in each tool's GitHub organizations over the period of the shared study-year slider. The tool, tool-category and
 * licence filters apply; others (country, sector…) say nothing about who writes the code.
 */
export default function Builders() {
  const { filters } = useChart('builders');
  const months = windowMonths(filters.period);
  const [metric, setMetric] = useState<Metric>('prs');
  const tools = OPEN_TOOLS.filter((t) =>
    (filters.toolName === 'All' || filters.toolName === t) &&
    (filters.toolCategory === 'All' || toolInfo(t)!.categories.includes(filters.toolCategory)) &&
    filters.license !== 'proprietary');
  const key = tools.join();
  const orgs = useMemo(() => contributorsInWindow(tools, months, CONTRIBUTORS, metric), [key, months, metric]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChartCard
      id="builders"
      title="Who builds the open-source tools"
      description={<>Organizations whose people contribute most to each tool’s code.
        People count for the organization in the “Company” field of their public GitHub profile (e.g. <span className="text-ink-300">@open-energy-transition</span>);{' '}
        <Link href="/about#contributions" className="text-ink-300 underline decoration-ink-700 underline-offset-2 hover:text-ink-50">how to be counted</Link>.</>}
      fields={['period', 'toolName', 'toolCategory', 'license']}
      years
      undatedNote={false}
      choices={CHOICES}
      actions={<MetricSwitch value={metric} onChange={setMetric} />}
    >
      {(['country', 'sector', 'orgType'] as const).some((k) => filters[k] !== DEFAULT_FILTERS[k]) && (
        <p className="mb-4 text-xs text-ink-500">Code contributions are not tied to a country, sector or type of organization, so those filters don’t change this ranking.</p>
      )}
      {tools.length === 0 ? (
        <EmptyState title="No open-source tool matches these filters"
          message={filters.toolName !== 'All' && !isOpenSource(filters.toolName) ? `${filters.toolName} is proprietary: its code and contributors are not public.` : 'Change the tool or category filter.'} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {tools.map((t) => (
              <Link key={t} href={`/tools/${slug(t)}#builders`} className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-50">
                <ToolLogo name={t} size={16} />{t}
              </Link>
            ))}
          </div>
          <ContributorBars orgs={orgs} showTools={tools.length > 1} metric={metric} />
          <ContributionSource tools={tools} />
        </>
      )}
      <ContributionCaveat />
    </ChartCard>
  );
}
