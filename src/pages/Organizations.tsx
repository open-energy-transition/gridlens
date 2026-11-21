import { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import type { CatalogueRecord } from '../types';
import { Link, slug } from '../lib/router';
import { organizationDirectory } from '../lib/insights';
import { ORG_GROUPS, orgGroupLabel } from '../lib/orgTypes';
import { TOOLS } from '../lib/tools';
import { host } from '../sections/Providers';

const PAGE = 40;

/** Every organization with the tools it uses, searchable and filterable by type and tool. */
export default function Organizations({ catalogue }: { catalogue: CatalogueRecord[] }) {
  const all = useMemo(() => organizationDirectory(catalogue), [catalogue]);
  const params = new URLSearchParams(window.location.search);
  const [group, setGroup] = useState(params.get('type') ?? 'All');
  const [tool, setTool] = useState(params.get('tool') ?? 'All');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const groups = ORG_GROUPS.filter((g) => all.some((o) => o.group === g.id));
  const list = all.filter((o) =>
    (group === 'All' || o.group === group) &&
    (tool === 'All' || o.tools.includes(tool)) &&
    (!q || `${o.name} ${o.countries.join(' ')}`.toLowerCase().includes(q.toLowerCase())));

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(window.location.search);
    if (value === 'All') p.delete(key); else p.set(key, value);
    const s = p.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${s ? `?${s}` : ''}`);
  }

  function pickGroup(id: string) { setGroup(id); setParam('type', id); setLimit(PAGE); }
  // Organizations per type, for the tool and search chosen (so the numbers match what a click shows).
  const count = new Map<string, number>();
  for (const o of all) {
    if ((tool !== 'All' && !o.tools.includes(tool)) || (q && !`${o.name} ${o.countries.join(' ')}`.toLowerCase().includes(q.toLowerCase()))) continue;
    count.set(o.group, (count.get(o.group) ?? 0) + 1);
    count.set('All', (count.get('All') ?? 0) + 1);
  }
  const select = 'h-10 w-full min-w-0 rounded-full border border-ink-700 bg-ink-900/60 px-3 text-sm text-ink-100 outline-none focus:border-brand-500 sm:w-auto';
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? 'border-ink-50 bg-ink-50 text-ink-950' : 'border-ink-700 text-ink-300 hover:border-ink-500'}`;

  return (
    <div className="pt-10 md:pt-14">
      <h1 className="font-display text-5xl text-ink-50">Organizations</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-300">
        {all.length.toLocaleString('en')} organizations with documented use of the tracked tools. Filter by type to find peers,
        or by consultancies to find companies that deliver modelling studies.
      </p>

      {/* Types: every chip visible on wider screens (they wrap); on phones a select, like the tool filter. */}
      <div className="mt-8 hidden flex-wrap gap-2 sm:flex" role="group" aria-label="Type of organization">
        {[{ id: 'All', label: 'All' }, ...groups].map((g) => (
          <button key={g.id} type="button" aria-pressed={group === g.id} className={chip(group === g.id)} onClick={() => pickGroup(g.id)}>
            {g.label} <span className={`tabular ml-1 ${group === g.id ? 'text-ink-600' : 'text-ink-500'}`}>{(count.get(g.id) ?? 0).toLocaleString('en')}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:mt-3 sm:flex sm:gap-3">
        <label className="relative col-span-2 sm:flex-1">
          <span className="sr-only">Search organizations</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search by name or country"
            className="h-10 w-full rounded-full border border-ink-700 bg-ink-900/60 pl-9 pr-4 text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-brand-500" />
        </label>
        <label className="sm:hidden">
          <span className="sr-only">Type of organization</span>
          <select value={group} onChange={(e) => pickGroup(e.target.value)} className={select}>
            {[{ id: 'All', label: 'All types' }, ...groups].map((g) => <option key={g.id} value={g.id}>{g.label} ({(count.get(g.id) ?? 0).toLocaleString('en')})</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-400">
          <span className="hidden sm:inline">Tool</span>
          <span className="sr-only sm:hidden">Tool</span>
          <select value={tool} onChange={(e) => { setTool(e.target.value); setParam('tool', e.target.value); setLimit(PAGE); }} className={select}>
            <option value="All">All tools</option>
            {TOOLS.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-ink-500">{list.length.toLocaleString('en')} organizations</p>
      <div className="mt-2 overflow-hidden rounded-2xl border border-ink-800/80">
        <table className="w-full text-sm">
          <thead className="hidden bg-ink-900/60 text-left text-xs text-ink-500 md:table-header-group">
            <tr>
              <th className="px-4 py-3 font-normal">Organization</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 font-normal">Tools</th>
              <th className="px-4 py-3 text-right font-normal">Projects</th>
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
                      {o.tools.map((t) => <Link key={t} href={`/tools/${slug(t)}`} className="rounded-full border border-ink-700 px-2.5 py-1 text-xs text-ink-300 hover:border-ink-500 hover:text-ink-50">{t}</Link>)}
                    </span>
                  </td>
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
    </div>
  );
}
