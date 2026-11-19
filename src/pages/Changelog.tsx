import changelogData from '../data/changelog.json';

type Tag = 'added' | 'removed' | 'reclassified' | 'coverage';

interface Entry {
  date: string;
  tag: Tag;
  title: string;
  description: string;
}

const entries = changelogData as Entry[];

const TAGS: Record<Tag, { label: string; dot: string }> = {
  added: { label: 'Added', dot: 'bg-brand-400' },
  coverage: { label: 'Coverage', dot: 'bg-rose-400' },
  reclassified: { label: 'Reclassified', dot: 'bg-[#7fb3d5]' },
  removed: { label: 'Removed', dot: 'bg-ink-500' },
};

/** What changed in the data, newest first. App-only changes are not listed. */
export default function Changelog() {
  return (
    <div className="pt-10 md:pt-14">
      <h1 className="font-display text-5xl text-ink-50">Changelog</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-300">
        Every change to the data: organizations and projects added or removed, reclassified, or newly covered regions.
      </p>
      <ol className="mt-10 max-w-3xl border-l border-ink-800">
        {entries.map((e, i) => (
          <li key={i} className="relative pb-10 pl-8 last:pb-0">
            <span className={`absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full ${TAGS[e.tag].dot}`} aria-hidden="true" />
            <p className="flex flex-wrap items-baseline gap-x-3 text-xs text-ink-500">
              <time>{e.date}</time>
              <span className="uppercase tracking-[0.14em]">{TAGS[e.tag].label}</span>
            </p>
            <h2 className="font-display mt-1 text-2xl text-ink-50">{e.title}</h2>
            <p className="mt-2 leading-relaxed text-ink-300">{e.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
