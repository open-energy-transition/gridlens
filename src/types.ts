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
}

export interface ProjectOrg {
  name: string;
  role: string;
  institution_category: string;
  country_label: string;
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
  license: 'All',
  evidenceStrength: 'All',
  sourceGroup: 'All',
  search: '',
};

export type Section =
  | 'overview'
  | 'geographic'
  | 'tools'
  | 'decisions'
  | 'institutions'
  | 'top-users'
  | 'records'
  | 'about'
  | 'changelog';
