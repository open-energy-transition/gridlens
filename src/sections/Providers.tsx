import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useChart } from '../lib/chartFilters';
import { serviceProviders, type OrgEntry } from '../lib/insights';
import { Link, slug } from '../lib/router';
import ChartCard from '../components/chart/ChartCard';
import Segmented from '../components/chart/Segmented';
import EmptyState from '../components/common/EmptyState';

const SHOWN = 12;

/** Host name for a link label: "https://www.openenergytransition.org/x" → "openenergytransition.org". */
export function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Grid of companies with their tools and a quick link (website, or latest project when unknown). */
export function ProviderList({ list }: { list: OrgEntry[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, SHOWN);
  if (list.length === 0) return <EmptyState title="No consultancies documented for this selection yet" />;
  return (
    <>
      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-ink-800/80 bg-ink-800/80 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => {
          const href = p.website || p.latestSource;
          return (
            <li key={p.name} className="flex flex-col gap-2 bg-ink-950/90 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink-50">{p.name}</p>
                <span className="tabular shrink-0 text-xs text-ink-500">{p.projects} project{p.projects === 1 ? '' : 's'}</span>
              </div>
              <p className="text-xs text-ink-400">
                {p.countries.length > 0 && <>Projects in {p.countries.slice(0, 2).join(', ')}{p.countries.length > 2 ? ' and more' : ''} · </>}
                {p.tools.map((t, i) => (
                  <span key={t}>{i > 0 && ', '}<Link href={`/tools/${slug(t)}`} className="hover:text-ink-100">{t}</Link></span>
                ))}
              </p>
              {href && (
                <a href={href} target="_blank" rel="noreferrer"
                  className="mt-auto inline-flex items-center gap-1 text-sm text-brand-300 hover:text-brand-200">
                  {p.website ? host(p.website) : `Latest project${p.latestYear ? ` (${p.latestYear})` : ''}`}
                  <ArrowUpRight size={14} />
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {list.length > SHOWN && (
        <button type="button" onClick={() => setAll((a) => !a)}
          className="mt-4 h-9 rounded-full border border-ink-700 px-4 text-xs text-ink-300 hover:text-ink-50">
          {all ? 'Show fewer' : `Show all ${list.length}`}
        </button>
      )}
    </>
  );
}

/**
 * Consultancies that deliver modelling, for industry users looking for help; open-source tools by
 * default, since anyone can offer services on them.
 */
export default function Providers() {
  const { records, filters } = useChart('providers');
  const [scope, setScope] = useState('open');
  const tool = filters.toolName === 'All' ? undefined : filters.toolName;
  const list = useMemo(() => serviceProviders(records, { tool, openOnly: scope === 'open' }), [records, tool, scope]);
  return (
    <ChartCard
      id="providers"
      title="Who can help you model"
      description="Consultancies with documented projects, for teams that want to commission a study or get support with a tool."
      fields={['country', 'toolName', 'period', 'search']}
      actions={<Segmented label="Tools" value={scope} onChange={setScope} options={[{ id: 'open', label: 'Open-source tools' }, { id: 'all', label: 'All tools' }]} />}
    >
      <ProviderList list={list} />
    </ChartCard>
  );
}
