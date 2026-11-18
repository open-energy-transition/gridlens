import type { CatalogueRecord } from '../types';

// 27 EU member states using the dataset's country spellings
export const EU_MEMBERS = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
  'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain',
];

// EUROPE = EU + UK, Norway, Switzerland, Iceland, and Western/Balkan/Eastern states
export const EUROPE = [
  ...EU_MEMBERS,
  'United Kingdom', 'Norway', 'Switzerland', 'Iceland',
  'Serbia', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Albania', 'Kosovo',
  'Ukraine', 'Moldova', 'Georgia', 'Turkey', 'Türkiye',
];

const EU_MEMBERS_SET = new Set(EU_MEMBERS);
const EUROPE_SET = new Set(EUROPE);

const REGION_LABELS_EU_LIKE = ['european union', 'eu', 'eu/eea'];
const REGION_LABELS_EUROPE_LIKE = ['europe', 'pan-european'];

export type ScopeLevel = 'national' | 'multi_country' | 'global';

export const SCOPE_ORDER: ScopeLevel[] = ['national', 'multi_country', 'global'];
export const SCOPE_LABELS: Record<ScopeLevel, string> = {
  national: 'National',
  multi_country: 'Multi-country',
  global: 'Global',
};

/**
 * Returns what scope level a record has for a given country.
 * - 'national' if the country is directly listed in record.countries or equals
 *   record.country_label for a national record.
 * - 'multi_country' if the record is multi_country and the country is either
 *   explicitly in countries, or is an EU member with a "European Union"-style
 *   region_label, or is in EUROPE with a "Europe"/"Pan-European"-style region_label.
 * - 'global' if the record is global scope.
 * - null otherwise.
 */
export function coversCountry(record: CatalogueRecord, country: string): ScopeLevel | null {
  const countries = record.countries;
  const geo_scope = record.geo_scope;

  // Global: covers all countries
  if (geo_scope === 'global') return 'global';

  // Direct match in countries list
  if (countries.includes(country)) {
    if (geo_scope === 'national') return 'national';
    if (geo_scope === 'multi_country') return 'multi_country';
  }

  // National record: country matches country_label
  if (geo_scope === 'national' && record.country_label === country) {
    return 'national';
  }

  // Multi-country with EU region_label
  if (geo_scope === 'multi_country') {
    const rl = (record.region_label || '').toLowerCase();
    if (REGION_LABELS_EU_LIKE.includes(rl) && EU_MEMBERS_SET.has(country)) {
      return 'multi_country';
    }
    if (REGION_LABELS_EUROPE_LIKE.some(p => rl.startsWith(p)) && EUROPE_SET.has(country)) {
      return 'multi_country';
    }
  }

  return null;
}

/** Build a display label for a scope. */
export function scopeLabel(record: CatalogueRecord): string {
  if (record.region_label) {
    return `${record.region_label} study`;
  }
  return SCOPE_LABELS[record.geo_scope as ScopeLevel] ?? 'Study';
}
