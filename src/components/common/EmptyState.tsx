import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
}

export default function EmptyState({
  title = 'No data for the current filters',
  message = 'Try widening your filters or clearing the search to see results.',
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-800 bg-ink-900/40 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800/60 text-ink-500">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-ink-300">{title}</p>
      <p className="max-w-sm text-sm text-ink-500">{message}</p>
    </div>
  );
}
