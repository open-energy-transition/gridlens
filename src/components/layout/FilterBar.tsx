import { Search, SlidersHorizontal, X, Menu } from 'lucide-react';
import type { Filters } from '../../types';

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  countries: string[];
  toolNames: string[];
  toolCategories: string[];
  evidenceStrengths: string[];
  sourceTypes: string[];
  onToggleSidebar: () => void;
  resultCount: number;
  totalCount: number;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-ink-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={value}
        className="w-40 truncate rounded-lg border border-ink-800 bg-ink-900 px-2.5 py-1.5 text-sm text-ink-200 outline-none focus:border-brand-500 sm:w-44"
      >
        <option value="All">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FilterBar({
  filters,
  onChange,
  countries,
  toolNames,
  toolCategories,
  evidenceStrengths,
  sourceTypes,
  onToggleSidebar,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.country !== 'All' ||
    filters.toolName !== 'All' ||
    filters.toolCategory !== 'All' ||
    filters.evidenceStrength !== 'All' ||
    filters.sourceType !== 'All' ||
    filters.search.trim() !== '';

  return (
    <div className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar navigation"
          className="rounded-lg border border-ink-800 p-2 text-ink-400 hover:text-ink-200 md:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 text-ink-500">
          <SlidersHorizontal size={16} />
          <span className="text-xs font-semibold uppercase tracking-wide">Filters</span>
        </div>
        <Select
          label="Country"
          value={filters.country}
          options={countries}
          onChange={(v) => onChange({ ...filters, country: v })}
        />
        <Select
          label="Tool"
          value={filters.toolName}
          options={toolNames}
          onChange={(v) => onChange({ ...filters, toolName: v })}
        />
        <Select
          label="Tool category"
          value={filters.toolCategory}
          options={toolCategories}
          onChange={(v) => onChange({ ...filters, toolCategory: v })}
        />
        <Select
          label="Evidence strength"
          value={filters.evidenceStrength}
          options={evidenceStrengths}
          onChange={(v) => onChange({ ...filters, evidenceStrength: v })}
        />
        <Select
          label="Source type"
          value={filters.sourceType}
          options={sourceTypes}
          onChange={(v) => onChange({ ...filters, sourceType: v })}
        />
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-400">
          Search
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Search all fields…"
              className="w-52 rounded-lg border border-ink-800 bg-ink-900 py-1.5 pl-8 pr-2.5 text-sm text-ink-200 outline-none focus:border-brand-500"
            />
          </div>
        </label>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({ country: 'All', toolName: 'All', toolCategory: 'All', evidenceStrength: 'All', sourceType: 'All', search: '' })
            }
            className="flex items-center gap-1 rounded-lg border border-ink-800 px-2.5 py-1.5 text-xs font-medium text-ink-400 hover:text-ink-200"
          >
            <X size={14} />
            Clear
          </button>
        )}
        <div className="ml-auto text-xs text-ink-500">
          Showing <span className="font-semibold text-ink-200">{resultCount}</span> of {totalCount} records
        </div>
      </div>
    </div>
  );
}
