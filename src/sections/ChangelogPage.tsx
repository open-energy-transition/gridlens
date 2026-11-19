import { useState } from 'react';
import changelogData from '../data/changelog.json';
import Card from '../components/common/Card';

type ChangelogTag = 'added' | 'removed' | 'reclassified' | 'coverage';

interface ChangelogEntry {
  date: string;
  tag: ChangelogTag;
  title: string;
  description: string;
}

const entries = changelogData as ChangelogEntry[];

const TAG_STYLES: Record<ChangelogTag, { label: string; className: string; icon: string }> = {
  added: { label: 'New org', className: 'bg-sage-500/15 text-sage-400 ring-sage-500/30', icon: '➕' },
  removed: { label: 'Removed', className: 'bg-brand-500/15 text-brand-400 ring-brand-500/30', icon: '➖' },
  reclassified: { label: 'Reclassified', className: 'bg-sky-500/15 text-sky-400 ring-sky-500/30', icon: '🔄' },
  coverage: { label: 'Coverage', className: 'bg-amber-500/15 text-amber-400 ring-amber-500/30', icon: '🌍' },
};

/** Changelog — shows 5 newest entries with a "Show all" button. */
export default function ChangelogPage() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, 5);

  return (
    <>
      <h2 className="font-display mb-4 text-xl font-semibold text-ink-50">Changelog</h2>
      <p className="mb-4 text-sm leading-relaxed text-ink-500">
        Every organization added, removed, or reclassified in the dataset, with evidence. App-only changes (design, bug fixes) aren't tracked here — this is a record of what changed in the data.
      </p>
      <Card title="What's changed">
        <ul className="divide-y divide-ink-800">
          {visible.map((entry, i) => {
            const style = TAG_STYLES[entry.tag];
            return (
              <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${style.className}`}
                >
                  <span className="text-xs">{style.icon}</span>
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
        {entries.length > 5 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 w-full rounded-md border border-ink-800 py-2 text-xs font-semibold text-ink-400 transition-colors hover:border-ink-700 hover:text-ink-200"
          >
            Show all changelog ({entries.length})
          </button>
        )}
      </Card>
    </>
  );
}
