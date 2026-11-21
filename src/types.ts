export interface CatalogueRecord {
  country_label: string;
  institution_name: string;
  institution_category: string;
  role: string;
  official_website: string;
  tool_name: string;
  tool_category: string;
  use_case: string;
  summary: string;
  evidence_strength: string;
  source_type: string;
  source_group: string;
  source_title: string;
  source_date: string;
  source_link: string;
  exact_snippet_or_quote: string;
  why_it_supports_the_claim: string;
  notes: string;
  dataset_origin: string;
  decision_type: string;
  decision_basis: string;
  // Project fields
  project_id: string;
  project_title: string;
  organizations: ProjectOrg[];
  countries: string[];
  geo_scope: string;
  region_label: string;
  sources: ProjectSource[];
  /** Year of the study, when the sources date it. */
  year?: number | null;
  /** Date of the study as precise as the sources give it: "2024", "2024-03" or "2024-03-12". */
  date?: string | null;
}

export interface ProjectOrg {
  name: string;
  role: string;
  institution_category: string;
  country_label: string;
  /** Organization's own website, when known. */
  website?: string;
}

export interface ProjectSource {
  title: string;
  date: string;
  link: string;
  quote: string;
  source_type: string;
}

export interface Filters {
  country: string;
  toolName: string;
  toolCategory: string;
  orgType: string;
  sector: string;
  /** Only studies from the last N years ('1' … '20'), or 'All'. */
  period: string;
  /** With a period: 'include' also counts projects whose year is unknown; 'exclude' leaves them out. */
  undated: string;
  license: string;
  evidenceStrength: string;
  sourceGroup: string;
  search: string;
}

export const EMPTY_FILTERS: Filters = {
  country: 'All',
  toolName: 'All',
  toolCategory: 'All',
  orgType: 'All',
  sector: 'All',
  period: 'All',
  undated: 'exclude',
  license: 'All',
  evidenceStrength: 'All',
  sourceGroup: 'All',
  search: '',
};

/** What a reader sees first: the last five years. URLs and "Clear all" are relative to this. */
export const DEFAULT_FILTERS: Filters = { ...EMPTY_FILTERS, period: '5' };
