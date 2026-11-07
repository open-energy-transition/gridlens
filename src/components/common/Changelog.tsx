import { PlusCircle, MinusCircle, Shuffle, Globe2 } from 'lucide-react';
import changelogData from '../../data/changelog.json';
import Card from './Card';

type ChangelogTag = 'added' | 'removed' | 'reclassified' | 'coverage';

interface ChangelogEntry {
  date: string;
  tag: ChangelogTag;
  title: string;
  description: string;
}

const entries = changelogData as ChangelogEntry[];

const TAG_STYLES: Record<ChangelogTag, { label: string; className: string; icon: typeof PlusCircle }> = {
  added: { label: 'New org', className: 'bg-sage-500/15 text-sage-400 ring-sage-500/30', icon: PlusCircle },
  removed: { label: 'Removed', className: 'bg-brand-500/15 text-brand-400 ring-brand-500/30', icon: MinusCircle },
  reclassified: { label: 'Reclassified', className: 'bg-sky-500/15 text-sky-400 ring-sky-500/30', icon: Shuffle },
  coverage: { label: 'Coverage', className: 'bg-amber-500/15 text-amber-400 ring-amber-500/30', icon: Globe2 },
};

interface ChangelogProps {
  limit?: number;
  onSeeMore?: () => void;
}

export default function Changelog({ limit, onSeeMore }: ChangelogProps) {
  const visible = typeof limit === 'number' ? entries.slice(0, limit) : entries;
  const hasMore = typeof limit === 'number' && entries.length > limit;

  return (
    <Card title="What's changed" className="mb-6">
      <ul className="divide-y divide-ink-800">
        {visible.map((entry, i) => {
          const style = TAG_STYLES[entry.tag];
          const Icon = style.icon;
          return (
            <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${style.className}`}
              >
                <Icon size={13} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${style.className}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-sm font-semibold text-ink-100">{entry.title}</span>
                  <span className="text-xs text-ink-600">{entry.date}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{entry.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore && onSeeMore && (
        <button
          type="button"
          onClick={onSeeMore}
          className="mt-3 w-full rounded-md border border-ink-800 py-2 text-xs font-semibold text-ink-400 transition-colors hover:border-ink-700 hover:text-ink-200"
        >
          See full changelog ({entries.length})
        </button>
      )}
    </Card>
  );
}
