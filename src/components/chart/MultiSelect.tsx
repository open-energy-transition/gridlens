import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { toggleValue, valuesOf } from '../../lib/multi';

/** A searchable list with several choices (e.g. a set of countries); "All" when none is ticked. */
export default function MultiSelect({ label, value, options, display, onChange }: {
  label: string; value: string; options: string[]; display: (v: string) => string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const chosen = valuesOf(value);
  const searchable = options.length > 8;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', close);
    box.current?.addEventListener('keydown', esc);
    const el = box.current;
    return () => { document.removeEventListener('mousedown', close); el?.removeEventListener('keydown', esc); };
  }, [open]);

  // Ticked choices first, then the rest; the search narrows both.
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const hit = options.filter((o) => !s || display(o).toLowerCase().includes(s));
    return [...hit.filter((o) => chosen.includes(o)), ...hit.filter((o) => !chosen.includes(o))];
  }, [options, q, value]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = chosen.length === 0 ? 'All' : chosen.length <= 2 ? chosen.map(display).join(', ') : `${display(chosen[0])} +${chosen.length - 1}`;

  // Open, the list takes the full width of the panel and sits in the flow, so the panel scrolls instead of cutting it off.
  return (
    <div ref={box} className={`flex flex-col gap-1 text-xs font-medium text-ink-400 ${open ? 'col-span-2' : ''}`}>
      <span id={`${label}-label`}>{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${label}-label`} onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-ink-900 px-2.5 py-2 text-left text-sm outline-none focus:border-brand-500 ${chosen.length ? 'border-brand-500/60 text-ink-100' : 'border-ink-800 text-ink-200'}`}>
        <span className="truncate">{summary}</span>
        <ChevronDown size={14} className="shrink-0 text-ink-500" />
      </button>
      {open && (
        <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-1.5">
          {searchable && (
            <span className="relative mb-1 block">
              <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-500" />
              <input autoFocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full rounded-md border border-ink-800 bg-ink-900 py-1.5 pl-7 pr-2 text-sm font-normal text-ink-200 outline-none focus:border-brand-500" />
            </span>
          )}
          <ul role="listbox" aria-multiselectable="true" aria-label={label} className="max-h-56 overflow-y-auto overscroll-contain">
            {list.map((o) => {
              const on = chosen.includes(o);
              return (
                <li key={o} role="option" aria-selected={on}>
                  <button type="button" onClick={() => onChange(toggleValue(value, o))}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-normal hover:bg-ink-800/70 ${on ? 'text-ink-50' : 'text-ink-300'}`}>
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-brand-500 bg-brand-500 text-ink-950' : 'border-ink-600'}`}>
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="truncate">{display(o)}</span>
                  </button>
                </li>
              );
            })}
            {list.length === 0 && <li className="px-2 py-1.5 text-sm font-normal text-ink-500">No match</li>}
          </ul>
          {chosen.length > 0 && (
            <button type="button" onClick={() => onChange('All')} className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-brand-300 hover:bg-ink-800/70">
              Clear {chosen.length} selected
            </button>
          )}
        </div>
      )}
    </div>
  );
}
