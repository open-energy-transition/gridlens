import { useMemo } from 'react';
import { useChart } from '../../lib/chartFilters';
import { applyFilters, PERIODS } from '../../lib/filters';
import StepSlider from './StepSlider';

const STEPS = [...PERIODS, 'All'];

function label(p: string) {
  return p === 'All' ? 'All years' : p === '1' ? '1 year' : `${p} years`;
}

/** Study years shown, shared by every chart: the last 1 to 20 years, or all. */
export default function YearSlider({ id }: { id: string }) {
  const { filters, setFilters } = useChart(id);
  return (
    <StepSlider steps={STEPS} value={STEPS.includes(filters.period) ? filters.period : 'All'} label={label}
      prefix={filters.period === 'All' ? 'Show' : 'Last'} onChange={(period) => setFilters({ ...filters, period })} />
  );
}

/** Projects (with the other filters applied) whose year is unknown: the ones a period leaves out. */
export function useUndatedCount(id: string, ignore: Parameters<typeof useChart>[1] = []) {
  const { filters, catalogue } = useChart(id, ignore);
  return useMemo(() => {
    const f = { ...filters, period: 'All' };
    for (const k of ignore ?? []) (f[k] as string) = 'All';
    return applyFilters(catalogue, f).filter((r) => !r.year).length;
  }, [catalogue, filters, ignore]);
}

/**
 * Projects whose year is unknown cannot be placed in a period. A tick box says how many there are and
 * counts them in or out; shown whenever a period is set.
 */
export function UndatedNote({ id, ignore = [], className = 'mb-4' }: { id: string; ignore?: Parameters<typeof useChart>[1]; className?: string }) {
  const { filters, setFilters } = useChart(id, ignore);
  const n = useUndatedCount(id, ignore);
  if (filters.period === 'All' || !n) return null;
  const included = filters.undated === 'include';
  return (
    <label className={`flex w-fit cursor-pointer items-center gap-2 text-xs text-ink-400 hover:text-ink-200 ${className}`}>
      <input type="checkbox" checked={included} onChange={(e) => setFilters({ ...filters, undated: e.target.checked ? 'include' : 'exclude' })}
        className="h-4 w-4 cursor-pointer rounded border-ink-600 bg-ink-900 accent-brand-500" />
      Include {n.toLocaleString('en')} projects with an unknown year
    </label>
  );
}
