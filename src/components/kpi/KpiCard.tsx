import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  context?: string;
}

export default function KpiCard({ icon: Icon, label, value, context }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-ink-800 bg-ink-900/60 p-5 shadow-sm shadow-black/20 transition-colors hover:border-brand-500/40">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-sage-500" aria-hidden="true" />
      <div className="flex items-center justify-between pl-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
          <Icon size={16} strokeWidth={1.75} />
        </div>
      </div>
      <p className="font-display pl-2 mt-2 text-4xl font-semibold leading-none tracking-tight text-ink-50">
        {value}
      </p>
      {context && <p className="mt-2 pl-2 text-xs text-ink-500">{context}</p>}
    </div>
  );
}
