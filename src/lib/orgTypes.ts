import type { CatalogueRecord } from '../types';

/**
 * A few peer groups for filtering by organization type, built from the
 * finer `institution_category` values in the data.
 */
export const ORG_GROUPS: { id: string; label: string; categories: string[] }[] = [
  { id: 'grid_operator', label: 'Grid & system operators', categories: ['utility_tso', 'utility_iso_rto', 'utility_distribution'] },
  { id: 'utility', label: 'Utilities & energy companies', categories: ['utility_generation', 'energy_company_diversified', 'project_developer'] },
  { id: 'regulator', label: 'Regulators', categories: ['government_regulator'] },
  { id: 'government', label: 'Ministries & government agencies', categories: ['government_agency'] },
  { id: 'international', label: 'International & development bodies', categories: ['international_body', 'development_bank', 'ngo_foundation'] },
  { id: 'consultancy', label: 'Consultancies & vendors', categories: ['consultancy', 'vendor'] },
  { id: 'research', label: 'Universities & research', categories: ['academic_research', 'think_tank'] },
  { id: 'other', label: 'Other', categories: ['industry_association', 'other', ''] },
];

const GROUP_OF = new Map(ORG_GROUPS.flatMap((g) => g.categories.map((c) => [c, g.id] as const)));
const LABEL_OF = new Map(ORG_GROUPS.map((g) => [g.id, g.label]));

export function orgGroup(r: Pick<CatalogueRecord, 'institution_category'>): string {
  return GROUP_OF.get(r.institution_category ?? '') ?? 'other';
}

/**
 * Two broad sectors for "who adopts this tool": industry & government (grid operators, utilities,
 * regulators, ministries, consultancies, international bodies) and academia & research.
 */
export const SECTORS: { id: string; label: string; groups: string[] }[] = [
  { id: 'industry', label: 'Industry & government', groups: ['grid_operator', 'utility', 'regulator', 'government', 'consultancy', 'international'] },
  { id: 'academia', label: 'Academia & research', groups: ['research'] },
];
const SECTOR_OF = new Map(SECTORS.flatMap((s) => s.groups.map((g) => [g, s.id] as const)));

export function sectorOf(r: Pick<CatalogueRecord, 'institution_category'>): string {
  return SECTOR_OF.get(orgGroup(r)) ?? 'other';
}

export function sectorLabel(id: string): string {
  return SECTORS.find((s) => s.id === id)?.label ?? id;
}

export function orgGroupLabel(id: string): string {
  return LABEL_OF.get(id) ?? id;
}

/** Where the evidence was published (source_group), as opposed to who the organization is (sector). */
export const SOURCE_GROUP_LABELS: Record<string, string> = {
  industry: 'Reports & official documents',
  academic: 'Academic publications',
};
