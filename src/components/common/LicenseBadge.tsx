import { isOpenSource } from '../../lib/tools';

/** Small pill marking a tool as open source or proprietary. */
export default function LicenseBadge({ tool }: { tool: string }) {
  const open = isOpenSource(tool);
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${
        open ? 'bg-emerald-500/15 text-emerald-400' : 'bg-ink-800 text-ink-400'
      }`}
      title={open ? 'Open-source software' : 'Proprietary (commercial licence)'}
    >
      {open ? 'Open source' : 'Proprietary'}
    </span>
  );
}
