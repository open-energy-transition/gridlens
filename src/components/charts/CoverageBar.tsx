import { UNKNOWN } from '../../lib/colors';

/**
 * How much of the data a chart can use: a thin bar split into entries with the information (solid) and
 * without it (striped), with both counts. Used under charts that leave the unknowns out.
 */
export default function CoverageBar({ known, unknown, knownLabel, unknownLabel }: {
  known: number;
  unknown: number;
  /** e.g. "projects with a known year" */
  knownLabel: string;
  /** e.g. "with an unknown year, not shown" */
  unknownLabel: string;
}) {
  const total = known + unknown;
  if (!total || !unknown) return null;
  return (
    <div className="mt-5">
      <div className="flex h-2 overflow-hidden rounded-full" role="img" aria-label={`${known} ${knownLabel}, ${unknown} ${unknownLabel}`}>
        <span className="bg-ink-400" style={{ width: `${(100 * known) / total}%` }} />
        <span style={{ width: `${(100 * unknown) / total}%`, background: `repeating-linear-gradient(135deg, ${UNKNOWN} 0 4px, #2a2e40 4px 8px)` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs">
        <span className="text-ink-300"><span className="tabular text-ink-100">{known.toLocaleString('en')}</span> {knownLabel}</span>
        <span className="text-ink-400"><span className="tabular text-ink-200">{unknown.toLocaleString('en')}</span> ({Math.round((100 * unknown) / total)}%) {unknownLabel}</span>
      </div>
    </div>
  );
}
