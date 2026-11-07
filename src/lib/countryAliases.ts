/**
 * Maps country names as they appear in our dataset (country_label) to the
 * exact name strings used by the world-atlas TopoJSON (countries-110m.json)
 * so the choropleth map can match them. Without this, any dataset country
 * whose name differs from the atlas's naming convention renders as
 * "no data" on the map even though it has real records — this silently
 * broke the United States (our #1 country by record count) along with
 * several others below.
 *
 * Only used for choropleth aggregation; the raw country_label is kept
 * everywhere else (filters, tables, Top-N lists) so we never lose or
 * rewrite the underlying data.
 */
export const DATASET_TO_ATLAS_NAME: Record<string, string> = {
  'United States': 'United States of America',
  'Czech Republic': 'Czechia',
  'Democratic Republic of Congo': 'Dem. Rep. Congo',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  "Cote d'Ivoire": "Côte d'Ivoire",
  Eswatini: 'eSwatini',
  'Dominican Republic': 'Dominican Rep.',
  'South Sudan': 'S. Sudan',
  // Two distinct spellings in our data for the same country — merge both
  // into the single atlas polygon so the map doesn't split its count.
  Türkiye: 'Turkey',
};

/** Resolve a dataset country_label to the name key used by the map atlas. */
export function toAtlasName(countryLabel: string): string {
  return DATASET_TO_ATLAS_NAME[countryLabel] ?? countryLabel;
}
