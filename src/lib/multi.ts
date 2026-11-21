import type { Filters } from '../types';

/** Filters that take several values at once (e.g. a set of countries); stored as "A|B" ('All' when none). */
export const MULTI: (keyof Filters)[] = ['country', 'toolName', 'toolCategory', 'decision', 'impact', 'orgType', 'evidenceStrength'];

const SEP = '|';

/** The values chosen in a filter; empty for 'All'. */
export function valuesOf(v: string): string[] {
  return v === 'All' || !v ? [] : v.split(SEP);
}

/** The filter value for a set of choices ('All' when none). */
export function joinValues(values: string[]): string {
  const unique = [...new Set(values.filter(Boolean))];
  return unique.length ? unique.join(SEP) : 'All';
}

/** Adds the value, or removes it when already chosen. */
export function toggleValue(v: string, value: string): string {
  const vs = valuesOf(v);
  return joinValues(vs.includes(value) ? vs.filter((x) => x !== value) : [...vs, value]);
}

/** A test for one filter: everything passes for 'All'. */
export function matcher(v: string): (x: string) => boolean {
  const vs = new Set(valuesOf(v));
  return vs.size ? (x) => vs.has(x) : () => true;
}

/** The single chosen value, when exactly one is chosen. */
export function single(v: string): string | undefined {
  const vs = valuesOf(v);
  return vs.length === 1 ? vs[0] : undefined;
}
