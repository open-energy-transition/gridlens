import type { Filters } from '../types';
import { EMPTY_FILTERS } from '../types';

/** URL query keys for each filter, e.g. /grid-decisions?country=Spain&tool=PyPSA. */
const PARAM: Record<keyof Filters, string> = {
  country: 'country',
  toolName: 'tool',
  toolCategory: 'category',
  orgType: 'org',
  license: 'license',
  evidenceStrength: 'evidence',
  sourceGroup: 'source',
  search: 'q',
};

/** Query string for the active filters ("" when none are set). */
export function filtersToSearch(filters: Filters): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(PARAM) as (keyof Filters)[]) {
    const value = filters[key].trim();
    if (value && value !== EMPTY_FILTERS[key]) params.set(PARAM[key], value);
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** Filters from a query string; unknown keys are ignored, missing ones keep their default. */
export function searchToFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  const filters = { ...EMPTY_FILTERS };
  for (const key of Object.keys(PARAM) as (keyof Filters)[]) {
    const value = params.get(PARAM[key]);
    if (value) filters[key] = value;
  }
  return filters;
}
