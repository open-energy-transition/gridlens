import type { Filters } from '../types';
import { EMPTY_FILTERS } from '../types';

/** URL query keys for each filter, e.g. ?decisions.country=Spain&decisions.tool=PyPSA. */
const PARAM: Record<keyof Filters, string> = {
  country: 'country',
  toolName: 'tool',
  toolCategory: 'category',
  orgType: 'org',
  sector: 'sector',
  period: 'years',
  license: 'license',
  evidenceStrength: 'evidence',
  sourceGroup: 'source',
  search: 'q',
};

const KEYS = Object.keys(PARAM) as (keyof Filters)[];

/** Number of filters that differ from the default. */
export function activeCount(filters: Filters): number {
  return KEYS.filter((k) => filters[k].trim() !== EMPTY_FILTERS[k]).length;
}

function write(params: URLSearchParams, filters: Filters, prefix = '') {
  for (const key of KEYS) {
    const value = filters[key].trim();
    if (value && value !== EMPTY_FILTERS[key]) params.set(prefix + PARAM[key], value);
  }
}

function read(params: URLSearchParams, prefix = ''): Filters {
  const filters = { ...EMPTY_FILTERS };
  for (const key of KEYS) {
    const value = params.get(prefix + PARAM[key]);
    if (value) filters[key] = value;
  }
  return filters;
}

/** Query string for one filter set ("" when none are set). */
export function filtersToSearch(filters: Filters): string {
  const params = new URLSearchParams();
  write(params, filters);
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** One filter set from a query string; unknown keys are ignored, missing ones keep their default. */
export function searchToFilters(search: string): Filters {
  return read(new URLSearchParams(search));
}

/**
 * Every chart keeps its own filters. In the URL they are prefixed with the chart id
 * (`?decisions.country=Spain&map.tool=PyPSA`), so one link restores the whole page.
 */
export type ChartFilters = Record<string, Filters>;

export function chartFiltersToSearch(state: ChartFilters): string {
  const params = new URLSearchParams();
  for (const id of Object.keys(state).sort()) write(params, state[id], `${id}.`);
  const s = params.toString();
  return s ? `?${s}` : '';
}

/**
 * Reads the filters of the given charts. Unprefixed keys (links from before charts had their own
 * filters, e.g. /grid-decisions?country=Spain) apply to `legacyChart`.
 */
export function searchToChartFilters(search: string, chartIds: string[], legacyChart?: string): ChartFilters {
  const params = new URLSearchParams(search);
  const legacy = read(params);
  const state: ChartFilters = {};
  for (const id of chartIds) {
    const own = read(params, `${id}.`);
    state[id] = id === legacyChart && activeCount(own) === 0 ? legacy : own;
  }
  return state;
}

/**
 * The address bar's query string with the charts' filters written in: other parameters stay
 * (e.g. a page's own ?type=), old unprefixed filters are removed once a chart has taken them over.
 */
export function mergeChartSearch(current: string, state: ChartFilters, dropUnprefixed: boolean): string {
  const params = new URLSearchParams(current);
  for (const key of [...params.keys()]) {
    const prefix = key.split('.')[0];
    if ((key.includes('.') && prefix in state) || (dropUnprefixed && (Object.values(PARAM) as string[]).includes(key))) params.delete(key);
  }
  for (const id of Object.keys(state).sort()) write(params, state[id], `${id}.`);
  const s = params.toString();
  return s ? `?${s}` : '';
}
