const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A study date as precise as the sources give it: "2024-03-12" → "12 Mar 2024", "2024-03" → "Mar 2024",
 * "2024" → "2024". Falls back to the year, and says so when neither is known.
 */
export function formatDate(date?: string | null, year?: number | null): string {
  const m = (date ?? '').match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (m) {
    const [, y, mo, d] = m;
    const month = mo ? MONTHS[Number(mo) - 1] : '';
    return [d ? String(Number(d)) : '', month, y].filter(Boolean).join(' ');
  }
  return year ? String(year) : 'Year unknown';
}

/** Sort key that orders mixed precisions sensibly: "2024" sorts with the start of 2024. */
export function dateKey(date?: string | null, year?: number | null): string {
  return date || (year ? String(year) : '');
}
