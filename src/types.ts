export interface CatalogueRecord {
  country_label: string;
  institution_name: string;
  official_website: string;
  tool_name: string;
  tool_category: string;
  use_case: string;
  evidence_strength: string;
  source_type: string;
  source_title: string;
  source_date: string;
  source_link: string;
  exact_snippet_or_quote: string;
  why_it_supports_the_claim: string;
  notes: string;
  dataset_origin: string;
  decision_type: string;
  decision_basis: string;
}

export interface Filters {
  country: string;
  toolName: string;
  toolCategory: string;
  evidenceStrength: string;
  sourceType: string;
  search: string;
}

export const EMPTY_FILTERS: Filters = {
  country: 'All',
  toolName: 'All',
  toolCategory: 'All',
  evidenceStrength: 'All',
  sourceType: 'All',
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
