import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { CatalogueRecord } from '../types';
import { Link, slug } from '../lib/router';
import { decisionOf, OTHER_DECISION, organizationDirectory, serviceProviders, toolStats, type ToolStats } from '../lib/insights';
import { TOOLS, toolInfo, isOpenSource } from '../lib/tools';
import { projectImpact } from '../lib/impact';
import { orgGroupLabel } from '../lib/orgTypes';
import { categoryLabel, splitCategories } from '../lib/toolCategories';
import { OPEN_SOURCE, PROPRIETARY } from '../lib/colors';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import Segmented from '../components/chart/Segmented';
import LicenseBadge from '../components/common/LicenseBadge';
import { ProviderList } from '../sections/Providers';

const THIS_YEAR = new Date().getFullYear();

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-8 items-end gap-[2px]" role="img" aria-label={`Projects per year, ${THIS_YEAR - 9}–${THIS_YEAR}`}>
      {values.map((v, i) => (
        <span key={i} className="flex-1 rounded-[1px]" style={{ height: `${Math.max(4, (100 * v) / max)}%`, background: v ? color : '#1f2234' }} />
      ))}
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="font-display tabular text-3xl text-ink-50">{value}</p>
      <p className="mt-1 text-xs leading-snug text-ink-400">{label}</p>
    </div>
  );
}

function ToolCard({ s }: { s: ToolStats }) {
  const info = toolInfo(s.name)!;
  const open = isOpenSource(s.name);
  return (
    <Link href={`/tools/${slug(s.name)}`} className="group flex flex-col gap-4 bg-ink-950/85 p-5 transition-colors hover:bg-ink-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-ink-50">{s.name}</p>
          <p className="mt-0.5 text-xs text-ink-500">{info.vendor}</p>
        </div>
        <LicenseBadge tool={s.name} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat value={s.organizations} label="organizations" />
        <Stat value={s.decisionMakers} label="decision-makers" />
        <Stat value={s.countries} label="countries" />
      </div>
      <Sparkline values={s.perYear} color={open ? OPEN_SOURCE : PROPRIETARY} />
      {s.topDecisions.length > 0 && (
        <p className="text-xs leading-relaxed text-ink-400">
          <span className="text-ink-500">Mostly for </span>
          {s.topDecisions.map((d) => d.name.split(' & ')[0].toLowerCase()).join(', ')}
        </p>
      )}
    </Link>
  );
}

const SORTS: Record<string, { label: string; key: (s: ToolStats) => number }> = {
  organizations: { label: 'Organizations', key: (s) => s.organizations },
  decisionMakers: { label: 'Decision-makers', key: (s) => s.decisionMakers },
  recent: { label: `Since ${THIS_YEAR - 4}`, key: (s) => s.recentProjects },
};

/** All tracked tools as cards with the evidence behind them. */
function ToolDirectory({ catalogue }: { catalogue: CatalogueRecord[] }) {
  const [licence, setLicence] = useState('All');
  const [sort, setSort] = useState('organizations');
  const stats = useMemo(() => toolStats(catalogue), [catalogue]);
  const shown = stats
    .filter((s) => licence === 'All' || (licence === 'open_source') === isOpenSource(s.name))
    .sort((a, b) => SORTS[sort].key(b) - SORTS[sort].key(a) || a.name.localeCompare(b.name));

  return (
    <div className="pt-10 md:pt-14">
      <h1 className="font-display text-5xl text-ink-50">Tools</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-300">
        The {TOOLS.length} modelling tools GridLens tracks, with the evidence behind each: who uses it, how many of them make real
        grid decisions, and where. Open a tool for its full profile.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Segmented label="Licence" value={licence} onChange={setLicence}
          options={[{ id: 'All', label: 'All' }, { id: 'open_source', label: 'Open source' }, { id: 'proprietary', label: 'Proprietary' }]} />
        <Segmented label="Sort by" value={sort} onChange={setSort} options={Object.entries(SORTS).map(([id, v]) => ({ id, label: v.label }))} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-800/80 bg-ink-800/80 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((s) => <ToolCard key={s.name} s={s} />)}
      </div>
      <p className="mt-4 text-xs text-ink-500">
        Decision-makers are grid and system operators, utilities, regulators and ministries. Bars show projects per year, {THIS_YEAR - 9}–{THIS_YEAR}.
      </p>
    </div>
  );
}

function Panel({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="rounded-2xl border border-ink-800/80 bg-ink-900/40 p-4 sm:p-6">
      <h2 className="font-display mb-4 text-xl text-ink-50">{title}</h2>
      {children}
      {note && <p className="mt-3 text-xs text-ink-500">{note}</p>}
    </section>
  );
}

/** Everything known about one tool: confidence signals, purposes, users, providers and projects. */
function ToolProfile({ catalogue, name }: { catalogue: CatalogueRecord[]; name: string }) {
  const info = toolInfo(name)!;
  const records = useMemo(() => catalogue.filter((r) => r.tool_name === name), [catalogue, name]);
  const s = useMemo(() => toolStats(catalogue).find((t) => t.name === name)!, [catalogue, name]);
  const orgs = useMemo(() => organizationDirectory(records), [records]);
  const providers = useMemo(() => serviceProviders(records), [records]);
  const decisions = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of records) if (decisionOf(r) !== OTHER_DECISION) m.set(decisionOf(r), (m.get(decisionOf(r)) ?? 0) + 1);
    return [...m].map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count);
  }, [records]);
  const countries = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of records) for (const c of r.countries) m.set(c, (m.get(c) ?? 0) + 1);
    return [...m].map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [records]);
  const notable = useMemo(
    () => records
      .filter((r) => projectImpact(r) === 'high')
      .sort((a, b) => Number(decisionOf(a) === OTHER_DECISION) - Number(decisionOf(b) === OTHER_DECISION) || (b.year ?? 0) - (a.year ?? 0))
      .slice(0, 6),
    [records],
  );
  const categories = [...new Set(records.flatMap((r) => splitCategories(r.tool_category)))].filter((c) => c !== 'unspecified' && c !== 'other');
  const strong = records.length ? Math.round((100 * records.filter((r) => r.evidence_strength === 'HIGH').length) / records.length) : 0;
  const open = isOpenSource(name);

  return (
    <div className="pt-8 md:pt-12">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100"><ArrowLeft size={14} />All tools</Link>
      <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3"><LicenseBadge tool={name} />{info.licenseName && <span className="text-xs text-ink-500">{info.licenseName}</span>}</div>
          <h1 className="font-display mt-3 text-5xl text-ink-50 sm:text-6xl">{name}</h1>
          <p className="mt-3 text-ink-300">
            {open ? 'Open-source' : 'Commercial'} tool by {info.vendor}
            {categories.length > 0 && <> for {categories.map(categoryLabel).join(', ').toLowerCase()}</>}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={info.url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-50 px-4 text-sm font-medium text-ink-950 hover:bg-white">
            Official site <ArrowUpRight size={15} />
          </a>
          <Link href={`/projects?projects.tool=${encodeURIComponent(name)}`} className="inline-flex h-10 items-center rounded-full border border-ink-700 px-4 text-sm text-ink-200 hover:border-ink-500">
            All {records.length} projects
          </Link>
        </div>
      </header>

      <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-ink-800/80 py-6 sm:grid-cols-3 lg:grid-cols-6">
        {[
          [s.organizations, 'organizations use it'],
          [s.decisionMakers, 'are decision-makers'],
          [s.gridOperators, 'are grid or system operators'],
          [s.countries, 'countries'],
          [s.recentProjects, `projects since ${THIS_YEAR - 4}`],
          [`${strong}%`, 'with strong evidence'],
        ].map(([v, l]) => (
          <div key={l as string}><dd className="font-display tabular text-4xl text-ink-50">{v}</dd><dt className="mt-1 text-xs text-ink-400">{l}</dt></div>
        ))}
      </dl>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Used for" note="Projects per grid decision; projects without a stated decision are left out.">
          {decisions.length ? <HorizontalBarChart data={decisions} colorOf={() => (open ? OPEN_SOURCE : PROPRIETARY)} unit="projects" /> : <p className="text-sm text-ink-500">No decision stated in the sources yet.</p>}
        </Panel>
        <Panel title="Top users" note="Organizations by number of projects with this tool.">
          <ul className="divide-y divide-ink-800/80">
            {orgs.filter((o) => o.name !== info.vendor).slice(0, 10).map((o) => (
              <li key={o.name} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                <span className="min-w-0">
                  <span className="text-ink-100">{o.name}</span>
                  <span className="ml-2 text-xs text-ink-500">{orgGroupLabel(o.group)}</span>
                </span>
                <span className="tabular shrink-0 text-ink-400">{o.projects}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Notable decisions" note="Most recent projects in which a grid operator, utility, regulator or ministry used or commissioned the tool.">
          <ul className="space-y-4">
            {notable.map((r) => (
              <li key={r.project_id || r.source_link} className="text-sm">
                <p className="text-ink-100">{r.organizations.map((o) => o.name).join(' · ')}</p>
                <p className="mt-0.5 text-xs text-ink-500">{[r.year, r.geo_scope === 'national' ? r.country_label : r.region_label || 'Multi-country', decisionOf(r) === OTHER_DECISION ? '' : r.decision_type].filter(Boolean).join(' · ')}</p>
                {(r.summary || r.use_case) && <p className="mt-1 leading-relaxed text-ink-300">{r.summary || r.use_case}</p>}
                {r.sources[0]?.link && <a href={r.sources[0].link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200">Source <ArrowUpRight size={12} /></a>}
              </li>
            ))}
            {notable.length === 0 && <li className="text-sm text-ink-500">None documented yet.</li>}
          </ul>
        </Panel>
        <Panel title="Where it is used" note="Projects per country; multi-country studies count in every country they cover.">
          <HorizontalBarChart data={countries} colorOf={() => (open ? OPEN_SOURCE : PROPRIETARY)} unit="projects" />
        </Panel>
      </div>
      <div className="mt-6">
        <Panel title={`Who delivers ${name} studies`} note={`Consultancies with documented ${name} projects. ${info.vendor} itself is not listed.`}>
          <ProviderList list={providers} />
        </Panel>
      </div>
    </div>
  );
}

export default function Tools({ catalogue, tool }: { catalogue: CatalogueRecord[]; tool?: string }) {
  const name = tool ? TOOLS.find((t) => slug(t.name) === tool)?.name : undefined;
  if (tool && !name) {
    return (
      <div className="pt-16">
        <p className="text-ink-300">No tool called “{tool}” is tracked.</p>
        <Link href="/tools" className="mt-4 inline-block text-brand-300">See all tools</Link>
      </div>
    );
  }
  return name ? <ToolProfile catalogue={catalogue} name={name} /> : <ToolDirectory catalogue={catalogue} />;
}
