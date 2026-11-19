import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { builders, CONTRIBUTORS, contributingOrgs, type ContributorOrg } from '../lib/contributors';
import { Link, slug } from '../lib/router';
import { TOOLS } from '../lib/tools';
import ChartCard from '../components/chart/ChartCard';
import EmptyState from '../components/common/EmptyState';
import ToolLogo from '../components/common/ToolLogo';

const OPEN_TOOLS = TOOLS.filter((t) => t.license === 'open_source' && CONTRIBUTORS.tools[t.name]).map((t) => t.name);
const SHOWN = 12;

/** Organizations ranked by pull requests merged into a tool's repositories in the last 24 months. */
/** The caveat shown with every contribution ranking. */
export function ContributionCaveat() {
  return (
    <p className="mt-5 border-l-2 border-ink-700 pl-3 text-xs leading-relaxed text-ink-500">
      A hint, not a verdict. Merged pull requests count only one kind of work, in one GitHub organization, and only for people
      who name an employer on their profile. Reviews, issues, documentation, teaching, funding and the many upstream and
      downstream projects these tools depend on are not counted. Every contribution to open source is valuable.
    </p>
  );
}

export function ContributorBars({ orgs, tools, limit = SHOWN }: { orgs: (ContributorOrg & { tools?: string[] })[]; tools?: boolean; limit?: number }) {
  const [all, setAll] = useState(false);
  if (orgs.length === 0) return <EmptyState title="No organizations found in the contributors’ profiles yet" />;
  const shown = all ? orgs : orgs.slice(0, limit);
  const max = Math.max(1, ...orgs.map((o) => o.recentPRs));
  return (
    <>
      <ol className="space-y-3 sm:space-y-2">
        {shown.map((o, i) => (
          <li key={o.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(12rem,20rem)_1fr_auto]">
            <span className="flex min-w-0 items-center gap-3 text-sm">
              <span className="tabular w-5 shrink-0 text-xs text-ink-600">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-ink-100">{o.name}</span>
                {tools && o.tools && (
                  <span className="mt-0.5 flex flex-wrap gap-x-2">
                    {o.tools.map((t) => <Link key={t} href={`/tools/${slug(t)}`} className="text-[11px] text-ink-500 hover:text-ink-200">{t}</Link>)}
                  </span>
                )}
              </span>
            </span>
            <span className="tabular whitespace-nowrap text-right text-xs text-ink-400 sm:order-last sm:w-44">
              <span className="text-sm text-ink-100">{o.recentPRs.toLocaleString('en')}</span> merged PRs · {o.contributors} {o.contributors === 1 ? 'person' : 'people'}
            </span>
            <div className="col-span-2 h-1.5 rounded-sm bg-ink-800/60 sm:col-span-1 sm:h-[18px]" aria-hidden="true">
              <div className="h-full rounded-sm bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${Math.max(1.5, (100 * o.recentPRs) / max)}%` }} />
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

/**
 * Who builds the open-source tools: organizations ranked by their people's pull requests merged into
 * each tool's GitHub organization in the last 24 months, so users can favour partners who give back.
 */
export default function Builders() {
  const [tool, setTool] = useState('All');
  const orgs = useMemo(() => (tool === 'All' ? builders(OPEN_TOOLS) : contributingOrgs(tool)).filter((o) => o.recentPRs > 0), [tool]);
  const info = tool === 'All' ? null : CONTRIBUTORS.tools[tool];

  return (
    <ChartCard
      id="builders"
      title="Who builds the open-source tools"
      description="Organizations whose people had the most pull requests merged into each tool’s code in the last 24 months. Working with them also supports the tools everyone uses."
      fields={[]}
    >
      <div role="tablist" aria-label="Tool" className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {['All', ...OPEN_TOOLS].map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tool === t} onClick={() => setTool(t)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${tool === t ? 'bg-ink-50 text-ink-950' : 'text-ink-400 hover:bg-ink-800/70 hover:text-ink-100'}`}>
            {t !== 'All' && <ToolLogo name={t} size={18} />}
            {t === 'All' ? 'All open-source tools' : t}
          </button>
        ))}
      </div>
      <ContributorBars orgs={orgs} tools={tool === 'All'} />
      <ContributionCaveat />
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
        <span>
          Pull requests merged into {info ? <>the {info.repositories} repositories of <a className="text-ink-300 hover:text-ink-100" href={`https://github.com/${info.githubOrg}`} target="_blank" rel="noreferrer">github.com/{info.githubOrg}</a></> : 'each tool’s GitHub organization'}
          {info && <>; {info.affiliated} of {info.contributors} contributors name an organization on their GitHub profile</>}. Updated {CONTRIBUTORS.generated}.
        </span>
        {tool !== 'All' && <Link href={`/tools/${slug(tool)}#builders`} className="inline-flex items-center gap-1 text-brand-300 hover:text-brand-200">{tool} profile <ArrowUpRight size={12} /></Link>}
      </p>
    </ChartCard>
  );
}
