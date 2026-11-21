import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Link2, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Filters } from '../../types';
import { DEFAULT_FILTERS, type CatalogueRecord } from '../../types';
import YearSlider, { UndatedNote } from './YearSlider';
import { useChart, type FilterOptions } from '../../lib/chartFilters';
import { activeCount, filtersToSearch } from '../../lib/filterParams';
import { categoryLabel } from '../../lib/toolCategories';
import { PERIODS, periodStart } from '../../lib/filters';
import { orgGroupLabel, sectorLabel, SECTORS, SOURCE_GROUP_LABELS } from '../../lib/orgTypes';
import { LICENSE_LABELS } from '../../lib/tools';
import { DECISION_INFO } from '../../lib/insights';
import { IMPACT_INFO, type Impact } from '../../lib/impact';

export type FilterKey = keyof Filters;

/** All filters, in the order the panel shows them. */
export const ALL_FIELDS: FilterKey[] = [
  'country', 'toolName', 'period', 'decision', 'impact', 'sector', 'license', 'toolCategory', 'orgType', 'evidenceStrength', 'sourceGroup', 'search',
];

interface Field { label: string; options: (o: FilterOptions) => string[]; display: (v: string) => string; hint?: string }

const FIELDS: Record<Exclude<FilterKey, 'search'>, Field> = {
  country: { label: 'Country', options: (o) => o.countries, display: (v) => v },
  toolName: { label: 'Tool', options: (o) => o.toolNames, display: (v) => v },
  period: { label: 'Study year', options: () => PERIODS, display: (p) => (p === 'All' ? 'All years' : `Last ${p} year${p === '1' ? '' : 's'} (${periodStart(p)}+)`) },
  undated: { label: 'Unknown year', options: () => ['include'], display: (v) => (v === 'include' ? 'Unknown years included' : 'Unknown years left out') },
  sector: { label: 'Sector', options: () => SECTORS.map((s) => s.id), display: sectorLabel, hint: 'Who the organization is: industry and government, or academia.' },
  license: { label: 'Licence', options: () => ['open_source', 'proprietary'], display: (v) => LICENSE_LABELS[v] ?? v },
  toolCategory: { label: 'Tool category', options: (o) => o.toolCategories, display: categoryLabel },
  orgType: { label: 'Organization type', options: (o) => o.orgTypes, display: orgGroupLabel },
  evidenceStrength: { label: 'Evidence strength', options: (o) => o.evidenceStrengths, display: (v) => v },
  sourceGroup: { label: 'Evidence from', options: (o) => o.sourceGroups, display: (v) => SOURCE_GROUP_LABELS[v] ?? v,
    hint: 'Where the evidence was published, whoever the organization is.' },
  decision: { label: 'Grid decision', options: (o) => o.decisions, display: (v) => DECISION_INFO[v]?.short ?? v },
  impact: { label: 'Impact', options: () => ['high', 'medium', 'low'], display: (v) => IMPACT_INFO[v as Impact]?.label ?? v,
    hint: 'High: an operator, utility, regulator or ministry decided. Medium: their advisers. Lower: research.' },
};

function chipText(key: FilterKey, value: string) {
  return key === 'search' ? `“${value}”` : FIELDS[key].display(value);
}

function Select({ label, value, options, display, hint, onChange }: {
  label: string; value: string; options: string[]; display: (v: string) => string; hint?: string; onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-ink-400" title={hint}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-800 bg-ink-900 px-2.5 py-2 text-sm text-ink-200 outline-none focus:border-brand-500"
      >
        <option value="All">All</option>
        {options.map((o) => <option key={o} value={o}>{display(o)}</option>)}
      </select>
      {hint && <span className="text-[11px] font-normal leading-snug text-ink-500">{hint}</span>}
    </label>
  );
}

/**
 * Card for one chart: title, a filter button (popover on desktop, bottom sheet on phones) for the filters
 * every chart shares, the active ones as removable chips, and a button that copies a link to this view.
 */
export default function ChartCard({ id, title, description, fields = ALL_FIELDS, actions, plain = false, ignore = [], choices, years = false, undatedNote = true, scope, className = '', children }: {
  id: string;
  /** Extra classes for the card frame (e.g. h-full to match its neighbours in a grid row). */
  className?: string;
  /** Records this card is about (e.g. one tool's projects), for the unknown-year count. */
  scope?: (r: CatalogueRecord) => boolean;
  /** With `years`: show the tick box for projects with an unknown year (off where years do not apply to the data). */
  undatedNote?: boolean;
  /** Show the study-year slider (shared by every chart) and how many undated projects it leaves out. */
  years?: boolean;
  /** Filters this view sets itself (a tool page's tool): not counted, not offered. */
  ignore?: FilterKey[];
  /** Narrower choices for this chart (e.g. only the open-source tools). */
  choices?: Partial<FilterOptions>;
  title?: string;
  /** No card frame: for a page-wide filter bar around several panels. */
  plain?: boolean;
  description?: ReactNode;
  /** Filters offered for this chart. */
  fields?: FilterKey[];
  /** Extra controls next to the filter button (e.g. a metric switch). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { filters, setFilters, records, catalogue, options: all } = useChart(id, ignore);
  const options = { ...all, ...choices };
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  // Filters set away from their defaults (the badge on the Filters button).
  const changed = fields.filter((k) => !ignore.includes(k) && filters[k].trim() !== DEFAULT_FILTERS[k]).length;
  // The study period is always shown as a chip (also the default), so readers see which years they are looking at.
  const active = fields.filter((k) => !ignore.includes(k) && (filters[k].trim() !== DEFAULT_FILTERS[k] || (k === 'period' && years)));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('select, input')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}${filtersToSearch(filters)}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const set = (k: FilterKey, v: string) => setFilters({ ...filters, [k]: v });
  const iconBtn = 'flex h-9 items-center gap-1.5 rounded-full border border-ink-700/80 px-3 text-xs font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-50';

  return (
    <div className={`@container ${plain ? '' : 'rounded-2xl border border-ink-800/80 bg-ink-900/40 p-4 sm:p-6'} ${className}`}>
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <div className="order-1 min-w-0 flex-1 basis-48">
          {title && <h3 className="font-display text-xl font-medium text-ink-50">{title}</h3>}
          {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-400">{description}</p>}
        </div>
        {(actions || years) && <div className="order-3 flex basis-full flex-wrap items-center gap-x-4 gap-y-2 @5xl:order-2 @5xl:basis-auto">{years && <YearSlider id={id} />}{actions}</div>}
        <div className="relative order-2 flex items-center gap-2 @5xl:order-3">
          <button type="button" onClick={copyLink} className={iconBtn} aria-label={`Copy link to ${title ?? 'this view'}`} title="Copy link to this view">
            {copied ? <Check size={15} /> : <Link2 size={15} />}
          </button>
          {fields.length > 0 && <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Filters" className={`${iconBtn} ${changed ? 'border-brand-500/70 text-brand-200' : ''}`}>
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {/* Always takes its space, so neighbouring controls (the year slider) never shift when a filter is set. */}
            <span className={`min-w-5 rounded-full bg-brand-500/20 px-1.5 text-center tabular-nums ${changed ? '' : 'invisible hidden sm:inline-block'}`}>{changed || 0}</span>
          </button>}
          {open && (
            <>
              <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default bg-black/50 md:bg-transparent" />
              <div
                ref={panel}
                role="dialog"
                aria-label={`Filters for ${title ?? 'this page'}`}
                className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-ink-800 bg-ink-950 p-4 pb-6 shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:w-[34rem] md:rounded-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-100">Filters</p>
                    <p className="text-xs text-ink-500">Apply to every chart</p>
                  </div>
                  <span className="text-xs text-ink-500"><span className="font-semibold text-ink-200">{records.length}</span> of {catalogue.length} projects</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {fields.map((k) => k === 'search' ? (
                    <label key={k} className="col-span-2 flex flex-col gap-1 text-xs font-medium text-ink-400">
                      Search
                      <span className="relative">
                        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
                        <input
                          type="search"
                          value={filters.search}
                          onChange={(e) => set('search', e.target.value)}
                          placeholder="Search all fields…"
                          className="w-full rounded-lg border border-ink-800 bg-ink-900 py-2 pl-8 pr-2.5 text-sm text-ink-200 outline-none focus:border-brand-500"
                        />
                      </span>
                    </label>
                  ) : (
                    <Select key={k} label={FIELDS[k].label} value={filters[k]} options={FIELDS[k].options(options)} display={FIELDS[k].display} hint={FIELDS[k].hint} onChange={(v) => set(k, v)} />
                  ))}
                </div>
                {fields.includes('period') && undatedNote && <UndatedNote id={id} ignore={ignore} scope={scope} className="mt-3" />}
                <div className="sticky -bottom-6 -mx-4 mt-4 flex justify-end gap-2 border-t border-ink-800 bg-ink-950 px-4 pb-1 pt-3 md:static md:mx-0 md:border-0 md:p-0">
                  {activeCount(filters) > 0 && (
                    <button type="button" onClick={() => setFilters({ ...DEFAULT_FILTERS, ...Object.fromEntries(ignore.map((k) => [k, filters[k]])) })} className="rounded-full border border-ink-700 px-4 py-2 text-sm text-ink-300 hover:text-ink-100">Clear all</button>
                  )}
                  <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-ink-50 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-white">Done</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {active.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {active.map((k) => filters[k] === DEFAULT_FILTERS[k] ? (
            <span key={k} className="flex max-w-full items-center rounded-full border border-ink-800 px-2.5 py-1 text-xs text-ink-400">{chipText(k, filters[k])}</span>
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => set(k, DEFAULT_FILTERS[k])}
              className="flex max-w-full items-center gap-1 rounded-full border border-ink-700 bg-ink-800/60 px-2.5 py-1 text-xs text-ink-200 hover:border-ink-600"
              aria-label={`Remove filter ${chipText(k, filters[k])}`}
            >
              <span className="truncate">{chipText(k, filters[k])}</span>
              <X size={12} className="shrink-0" />
            </button>
          ))}
        </div>
      )}
      {years && undatedNote && <UndatedNote id={id} ignore={ignore} scope={scope} />}
      {children}
    </div>
  );
}
