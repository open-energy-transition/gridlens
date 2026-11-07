// Shared color palette used consistently across every chart in the app.
// Anchored by the two OET brand hues (red #e31937, sage #7c9885) and
// extended with a curated set of vivid-but-tasteful hues (teal, amber,
// violet, a second blue, pink, green, cyan) so multi-series charts
// (tool distribution, institutions, evidence strength) read as
// deliberate and energetic rather than a flat monochrome ramp.
export const PALETTE = [
  '#e31937', // OET red (brand)
  '#2dd4bf', // teal
  '#f59e0b', // amber
  '#7c9885', // OET sage (brand)
  '#8b5cf6', // violet
  '#38bdf8', // sky blue
  '#f472b6', // pink
  '#4ade80', // green
  '#fb7185', // rose
  '#22d3ee', // cyan
];

export const ACCENT = '#e31937';
export const ACCENT_DARK = '#9c0f28';

export function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

// Shared hex tokens for chart chrome (axes, grid, tooltips) so every
// recharts instance matches the rest of the OET-branded dark theme
// instead of leftover generic slate blues.
export const CHART_GRID = '#262626';
export const CHART_AXIS = '#6b6b6b';
export const CHART_TICK = '#8f8f8f';
export const CHART_TOOLTIP_BG = '#151515';
export const CHART_TOOLTIP_BORDER = '#333333';
export const CHART_TOOLTIP_TEXT = '#efefef';
export const CHART_CURSOR = 'rgba(124, 152, 133, 0.12)';

// Smooth sequential scale for the choropleth map: a pale/dark neutral at
// the low end, through sage, into the OET red at the high end — mirrors
// the Artificial-Analysis-style "dynamic" data-viz feel while staying on
// brand (instead of the old flat 3-4-step blue scale).
export const MAP_SCALE = ['#2f5d49', '#4c7a5e', '#7c9885', '#c99a6e', '#d9623f', '#e31937'];
export const MAP_NO_DATA = '#262626';
export const MAP_HOVER = '#f59e0b';

// Returns -1 for "no data", otherwise the MAP_SCALE bucket index. Shared by
// mapColorFor() (the actual map fill) and the legend's range labels, so the
// legend can never drift out of sync with what's actually rendered on the
// map -- it derives its numeric ranges from this exact same function rather
// than approximating or hand-computing thresholds separately.
export function bucketIndexFor(value: number, max: number): number {
  if (!max || !Number.isFinite(max) || max <= 0 || !Number.isFinite(value) || value <= 0) return -1;
  // Record counts per country are heavily right-skewed in this dataset
  // (one or two countries with 60+ records, most countries with 1-5). A
  // linear value/max ratio crushes every low-but-nonzero country into
  // bucket 0 alongside countries that are nearly indistinguishable from
  // true "no data" -- exactly the "low-count countries aren't visible"
  // bug. A sqrt scale compresses the high end and spreads out the low end,
  // so a country with 1-2 records still lands in a clearly visible bucket
  // instead of the bottom of a near-linear ramp.
  const ratio = Math.min(1, Math.sqrt(value / max));
  return Math.min(MAP_SCALE.length - 1, Math.round(ratio * (MAP_SCALE.length - 1)));
}

export function mapColorFor(value: number, max: number): string {
  const idx = bucketIndexFor(value, max);
  return idx === -1 ? MAP_NO_DATA : MAP_SCALE[idx];
}
