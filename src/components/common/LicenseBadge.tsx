import { isOpenSource } from '../../lib/tools';

/** Small mark for a tool's licence: ember for open source, slate for proprietary. */
export default function LicenseBadge({ tool }: { tool: string }) {
  const open = isOpenSource(tool);
  return (
    <span
      className={`shrink-0 rounded-full border px-1.5 py-px font-mono text-[10px] uppercase tracking-wide ${
        open ? 'border-brand-500/40 text-brand-300' : 'border-ink-700 text-ink-400'
      }`}
      title={open ? 'Open-source software' : 'Proprietary (commercial licence)'}
    >
      {open ? 'Open' : 'Proprietary'}
    </span>
  );
}
