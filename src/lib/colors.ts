// Shared palette for every chart. Warm ember and dusk rose carry the accent (as on OET's EarthPV);
// the remaining hues are muted so multi-series charts stay calm on the night-blue background.
export const PALETTE = [
  '#f2703f', // ember
  '#7fb3d5', // haze blue
  '#e27aa6', // dusk rose
  '#c9b26b', // straw
  '#8fac97', // OET sage
  '#a08bd8', // twilight violet
  '#5fb7a8', // sea green
  '#d98f5c', // clay
  '#9aa4c4', // slate
  '#e0a45a', // amber
];

export const ACCENT = '#f2703f';
export const ACCENT_DARK = '#ad4320';

/** Open-source tools: ember. Proprietary tools: cool slate. Used everywhere tools are coloured by licence. */
export const OPEN_SOURCE = '#f2703f';
export const PROPRIETARY = '#7d86a8';

export function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export const CHART_GRID = '#1f2234';
export const CHART_AXIS = '#45485d';
export const CHART_TICK = '#83849a';
export const CHART_TOOLTIP_BG = '#131626';
export const CHART_TOOLTIP_BORDER = '#2f3245';
export const CHART_TOOLTIP_TEXT = '#e8e3da';
export const CHART_CURSOR = 'rgba(242, 112, 63, 0.08)';

// Sequential map scale: from a dim dusk violet (a little evidence) to bright ember (a lot),
// like city lights on a night globe. The lowest step is clearly brighter than "no data".
export const MAP_SCALE = ['#4b3f7a', '#6e4a8c', '#9a5590', '#c9617a', '#ea7a52', '#ffb27a'];
export const MAP_NO_DATA = '#1a1d2e';
export const MAP_HOVER = '#f4efe6';

// Returns -1 for "no data", otherwise the MAP_SCALE bucket index. Shared by mapColorFor() and the
// legend, so the legend's ranges always match the map. A sqrt scale keeps countries with 1-2
// projects visible next to a few countries with very many.
export function bucketIndexFor(value: number, max: number): number {
  if (!max || !Number.isFinite(max) || max <= 0 || !Number.isFinite(value) || value <= 0) return -1;
  const ratio = Math.min(1, Math.sqrt(value / max));
  return Math.min(MAP_SCALE.length - 1, Math.round(ratio * (MAP_SCALE.length - 1)));
}

export function mapColorFor(value: number, max: number): string {
  const idx = bucketIndexFor(value, max);
  return idx === -1 ? MAP_NO_DATA : MAP_SCALE[idx];
}

/** Missing or unclassifiable data (unknown decision, year…): a quiet neutral, never a category colour. */
export const UNKNOWN = '#3b4058';
