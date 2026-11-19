import { Link, PAGES, type PagePath } from '../lib/router';

/** Tabs shared by the About pages: methodology, changelog, contact. */
export default function AboutTabs({ current }: { current: PagePath }) {
  return (
    <nav aria-label="About" className="flex gap-1 border-b border-ink-800/80 pt-8 md:pt-10">
      {PAGES.filter((p) => p.path.startsWith('/about')).map((p) => (
        <Link key={p.path} href={p.path} aria-current={current === p.path ? 'page' : undefined}
          className={`-mb-px border-b-2 px-3 pb-3 text-sm transition-colors ${current === p.path ? 'border-brand-500 text-ink-50' : 'border-transparent text-ink-400 hover:text-ink-100'}`}>
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
