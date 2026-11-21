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

/**
 * Projects whose year is unknown cannot be placed in a period. This line says how many are left out
 * (or included) and switches them in or out.
 */
export function UndatedNote({ id, ignore = [] }: { id: string; ignore?: Parameters<typeof useChart>[1] }) {
  const { filters, setFilters, catalogue } = useChart(id, ignore);
  const n = useMemo(() => {
    if (filters.period === 'All') return 0;
    const f = { ...filters, period: 'All' };
    for (const k of ignore ?? []) (f[k] as string) = 'All';
    return applyFilters(catalogue, f).filter((r) => !r.year).length;
  }, [catalogue, filters, ignore]);
  if (!n) return null;
  const included = filters.undated === 'include';
  return (
    <p className="mb-4 flex items-start gap-2 text-xs text-ink-500">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-600" aria-hidden="true" />
      <span>
      {included ? `Includes ${n.toLocaleString('en')} projects with an unknown year.` : `${n.toLocaleString('en')} projects with an unknown year are not counted.`}{' '}
      <button type="button" onClick={() => setFilters({ ...filters, undated: included ? 'exclude' : 'include' })}
        className="text-ink-300 underline decoration-ink-700 underline-offset-2 hover:text-ink-50">
        {included ? 'Leave them out' : 'Include them'}
      </button>
      </span>
    </p>
  );
}
