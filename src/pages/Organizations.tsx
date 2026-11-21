import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Search } from 'lucide-react';
import type { Filters } from '../types';
import { Link, slug } from '../lib/router';
import { useChart } from '../lib/chartFilters';
import { toggleValue, valuesOf } from '../lib/multi';
import { organizationDirectory, type OrgEntry } from '../lib/insights';
import { ORG_GROUPS, orgGroupLabel } from '../lib/orgTypes';
import { host } from '../sections/Providers';
import ChartCard from '../components/chart/ChartCard';
import ToolLogo from '../components/common/ToolLogo';

const PAGE = 40;
// The type is picked with the buttons above the table; the panel holds the filters shared with the rest of the site.
const FIELDS: (keyof Filters)[] = ['country', 'period', 'toolName', 'decision', 'impact', 'toolCategory', 'license', 'sector', 'evidenceStrength'];

type SortKey = 'name' | 'group' | 'projects' | 'latestYear';
const SORTS: { key: SortKey; label: string; desc: boolean }[] = [
  { key: 'projects', label: 'Most projects', desc: true },
  { key: 'latestYear', label: 'Most recent project', desc: true },
  { key: 'name', label: 'Name (A–Z)', desc: false },
  { key: 'group', label: 'Type', desc: false },
];

function compare(a: OrgEntry, b: OrgEntry, key: SortKey): number {
  if (key === 'name') return a.name.localeCompare(b.name);
  if (key === 'group') return orgGroupLabel(a.group).localeCompare(orgGroupLabel(b.group));
  if (key === 'latestYear') return (a.latestYear ?? 0) - (b.latestYear ?? 0);
  return a.projects - b.projects;
}

/** Every organization with the tools it uses. The filters are the site's shared ones: a country picked on the map applies here too. */
export default function Organizations() {
  const { records, filters, setFilters } = useChart('organizations', ['orgType']);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'projects', desc: true });

  // Older links used ?type=consultancy for the organization type.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('type');
    if (!t) return;
    if (ORG_GROUPS.some((g) => g.id === t)) setFilters({ ...filters, orgType: t });
    const p = new URLSearchParams(window.location.search);
    p.delete('type');
    window.history.replaceState(window.history.state, '', window.location.pathname + (p.size ? `?${p}` : ''));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const all = useMemo(() => organizationDirectory(records), [records]);
  const types = valuesOf(filters.orgType);
  const isOn = (id: string) => (id === 'All' ? !types.length : types.includes(id));
  const matches = (o: OrgEntry) => !q || `${o.name} ${o.countries.join(' ')}`.toLowerCase().includes(q.toLowerCase());
  // Organizations per type for the current filters and search, so each number is what a click shows.
  const count = new Map<string, number>([['All', 0]]);
  for (const o of all) if (matches(o)) { count.set(o.group, (count.get(o.group) ?? 0) + 1); count.set('All', count.get('All')! + 1); }
  const groups = [{ id: 'All', label: 'All' }, ...ORG_GROUPS.filter((g) => count.has(g.id) || types.includes(g.id))];

  const list = all
    .filter((o) => (!types.length || types.includes(o.group)) && matches(o))
    .sort((a, b) => (sort.desc ? -1 : 1) * compare(a, b, sort.key) || b.projects - a.projects || a.name.localeCompare(b.name));

  // Buttons: "All" clears, a type is added or removed (several types at once); the phone select picks one.
  const toggleGroup = (id: string) => { setFilters({ ...filters, orgType: id === 'All' ? 'All' : toggleValue(filters.orgType, id) }); setLimit(PAGE); };
  const pickGroup = (id: string) => { setFilters({ ...filters, orgType: id }); setLimit(PAGE); };
  const pickSort = (key: SortKey) => {
    const first = SORTS.find((s) => s.key === key)!.desc;
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: first }));
  };
  const select = 'h-10 w-full min-w-0 rounded-full border border-ink-700 bg-ink-900/60 px-3 text-sm text-ink-100 outline-none focus:border-brand-500';
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? 'border-ink-50 bg-ink-50 text-ink-950' : 'border-ink-700 text-ink-300 hover:border-ink-500'}`;

  const header = (k: SortKey, label: string, className = '') => (
    <th className={`px-4 py-3 font-normal ${className}`} aria-sort={sort.key === k ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
      <button type="button" onClick={() => pickSort(k)} className={`inline-flex items-center gap-1 hover:text-ink-200 ${sort.key === k ? 'text-ink-200' : ''}`}>
        {label}
        {sort.key === k && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
      </button>
    </th>
  );

  return (
    <div className="pt-10 md:pt-14">
      <h1 className="font-display text-5xl text-ink-50">Organizations</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-300">
        Organizations with documented use of the tracked tools. Filter by type to find peers, or by consultancies to find
        companies that deliver modelling studies.
      </p>

      {/* Types: every button visible on wider screens (they wrap); on phones a select. */}
      <div className="mt-8 hidden flex-wrap gap-2 sm:flex" role="group" aria-label="Type of organization">
        {groups.map((g) => (
          <button key={g.id} type="button" aria-pressed={isOn(g.id)} className={chip(isOn(g.id))} onClick={() => toggleGroup(g.id)}>
            {g.label} <span className={`tabular ml-1 ${isOn(g.id) ? 'text-ink-600' : 'text-ink-500'}`}>{(count.get(g.id) ?? 0).toLocaleString('en')}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:mt-3 sm:flex">
        <label className="relative col-span-2 sm:flex-1">
          <span className="sr-only">Search organizations</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search by name or country"
            className="h-10 w-full rounded-full border border-ink-700 bg-ink-900/60 pl-9 pr-4 text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-brand-500" />
        </label>
        <label className="sm:hidden">
          <span className="sr-only">Type of organization</span>
          <select value={types.length === 1 ? types[0] : types.length ? 'several' : 'All'} onChange={(e) => pickGroup(e.target.value)} className={select}>
            {types.length > 1 && <option value="several" disabled>{types.length} types</option>}
            {groups.map((g) => <option key={g.id} value={g.id}>{g.id === 'All' ? 'All types' : g.label} ({(count.get(g.id) ?? 0).toLocaleString('en')})</option>)}
          </select>
        </label>
        <label className="md:hidden">
          <span className="sr-only">Sort</span>
          <select value={`${sort.key}:${sort.desc}`} onChange={(e) => { const [key, desc] = e.target.value.split(':'); setSort({ key: key as SortKey, desc: desc === 'true' }); }} className={select}>
            {SORTS.map((s) => <option key={s.key} value={`${s.key}:${s.desc}`}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <ChartCard id="organizations" title={`${list.length.toLocaleString('en')} organizations`} years fields={FIELDS} ignore={['orgType']}>
          <div className="-mx-4 overflow-hidden border-y border-ink-800/80 sm:-mx-6">
            <table className="w-full text-sm">
              <thead className="hidden bg-ink-900/60 text-left text-xs text-ink-500 md:table-header-group">
                <tr>
                  {header('name', 'Organization')}
                  {header('group', 'Type')}
                  <th className="px-4 py-3 font-normal">Tools</th>
                  {header('latestYear', 'Latest', 'text-right')}
                  {header('projects', 'Projects', 'text-right')}
                  <th className="px-4 py-3 font-normal">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/80">
                {list.slice(0, limit).map((o) => {
                  const href = o.website || o.latestSource;
                  return (
                    <tr key={o.name} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-ink-800/40 md:table-row md:p-0">
                      <td className="md:px-4 md:py-3">
                        <p className="text-ink-50">{o.name}</p>
                        {o.countries.length > 0 && <p className="text-xs text-ink-500">Projects in {o.countries.slice(0, 3).join(', ')}{o.countries.length > 3 ? ` +${o.countries.length - 3}` : ''}</p>}
                      </td>
                      <td className="order-3 col-span-2 text-xs text-ink-400 md:px-4 md:py-3 md:text-sm">{orgGroupLabel(o.group)}</td>
                      <td className="order-4 col-span-2 md:px-4 md:py-3">
                        <span className="flex flex-wrap gap-1.5">
                          {o.tools.map((t) => (
                            <Link key={t} href={`/tools/${slug(t)}`} className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 py-0.5 pl-1 pr-2.5 text-xs text-ink-300 hover:border-ink-500 hover:text-ink-50">
                              <ToolLogo name={t} size={16} />{t}
                            </Link>
                          ))}
                        </span>
                      </td>
                      <td className="tabular hidden text-right text-ink-400 md:table-cell md:px-4 md:py-3">{o.latestYear ?? '–'}</td>
                      <td className="tabular text-right text-ink-300 md:px-4 md:py-3">{o.projects}</td>
                      <td className="order-5 col-span-2 md:px-4 md:py-3">
                        {href && (
                          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200">
                            {o.website ? host(o.website) : 'Latest source'} <ArrowUpRight size={12} />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {list.length > limit && (
            <button type="button" onClick={() => setLimit((l) => l + PAGE * 2)} className="mt-4 h-10 rounded-full border border-ink-700 px-5 text-sm text-ink-300 hover:text-ink-50">
              Show more ({list.length - limit} left)
            </button>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
