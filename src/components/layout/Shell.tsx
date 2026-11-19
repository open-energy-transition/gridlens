import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, PAGES, SECTIONS, type Route } from '../../lib/router';
import GitHubIcon from '../common/GitHubIcon';

const REPO = 'https://github.com/open-energy-transition/gridlens';
export const SUGGEST_URL = `${REPO}/issues/new?title=Suggest%20a%20project%20or%20correction`;

function useCurrentSection(enabled: boolean) {
  const [current, setCurrent] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    if (!enabled) return;
    const seen = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setCurrent(top.target.id);
      },
      { rootMargin: '-90px 0px -55% 0px' },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) seen.observe(el); });
    return () => seen.disconnect();
  }, [enabled]);
  return current;
}

function PageLinks({ route, onPick, vertical = false }: { route: Route; onPick?: () => void; vertical?: boolean }) {
  return (
    <ul className={vertical ? 'space-y-1' : 'flex items-center gap-1'}>
      {PAGES.map((p) => {
        const active = route.page === p.path;
        return (
          <li key={p.path}>
            <Link
              href={p.path}
              onClick={onPick}
              aria-current={active ? 'page' : undefined}
              className={`block rounded-full px-3 py-1.5 text-sm transition-colors ${
                active ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:text-ink-100'
              } ${vertical ? 'py-2.5 text-base' : ''}`}
            >
              {p.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Page frame: a top bar with the site's pages (a menu on phones), and on the overview a small
 * section index on the left, as on artificialanalysis.ai. Content is wide on large screens.
 */
export default function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const isOverview = route.page === '/' ;
  const current = useCurrentSection(isOverview);

  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; }, [menu]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-800/70 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GridLens home">
            <img src="/brand/app-logo.svg" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-[1.35rem] font-medium tracking-tight text-ink-50">GridLens</span>
          </Link>
          <nav aria-label="Pages" className="ml-4 hidden lg:block">
            <PageLinks route={route} />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={SUGGEST_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-ink-700 px-3.5 py-1.5 text-sm text-ink-200 transition-colors hover:border-brand-500/70 hover:text-ink-50 sm:block"
            >
              Suggest a project
            </a>
            <a href={REPO} target="_blank" rel="noreferrer" aria-label="GridLens on GitHub"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 hover:bg-ink-900 hover:text-ink-100">
              <GitHubIcon size={18} />
            </a>
            <button type="button" onClick={() => setMenu(true)} aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:bg-ink-900 lg:hidden">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-40 bg-ink-950/95 backdrop-blur lg:hidden" role="dialog" aria-label="Menu">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="font-display text-[1.35rem] text-ink-50">GridLens</span>
            <button type="button" onClick={() => setMenu(false)} aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:bg-ink-900">
              <X size={20} />
            </button>
          </div>
          <nav aria-label="Pages" className="px-4 pt-2">
            <PageLinks route={route} vertical onPick={() => setMenu(false)} />
            <a href={SUGGEST_URL} target="_blank" rel="noreferrer" className="mt-6 block rounded-full border border-ink-700 px-4 py-2.5 text-center text-ink-200">
              Suggest a project or correction
            </a>
          </nav>
        </div>
      )}

      <div className="mx-auto flex max-w-[1440px] gap-10 px-4 md:px-6">
        {isOverview && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-44 shrink-0 pt-10 xl:block" aria-label="On this page">
            <ul className="space-y-2 text-[13px]">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', `${location.pathname}${location.search}#${s.id}`); }}
                    className={`flex items-center gap-2.5 transition-colors ${current === s.id ? 'text-ink-50' : 'text-ink-500 hover:text-ink-200'}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 ${current === s.id ? 'bg-brand-500' : 'bg-ink-700'}`} aria-hidden="true" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <main className="min-w-0 flex-1 pb-20">{children}</main>
      </div>

      <footer className="border-t border-ink-800/70">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 text-sm text-ink-500 md:flex-row md:items-center md:px-6">
          <a href="https://openenergytransition.org/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-ink-300">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-ink-50 p-1">
              <img src="/brand/oet-mark-only.svg" alt="" className="h-full w-full object-contain" />
            </span>
            Built and maintained by Open Energy Transition
          </a>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 md:ml-auto">
            <Link href="/methodology" className="hover:text-ink-200">Methodology</Link>
            <Link href="/changelog" className="hover:text-ink-200">Changelog</Link>
            <Link href="/projects" className="hover:text-ink-200">Download data</Link>
            <a href={SUGGEST_URL} target="_blank" rel="noreferrer" className="hover:text-ink-200">Contact &amp; corrections</a>
            <a href={REPO} target="_blank" rel="noreferrer" className="hover:text-ink-200">GitHub</a>
          </nav>
        </div>
        <p className="mx-auto max-w-[1440px] px-4 pb-8 text-xs text-ink-600 md:px-6">
          Runs entirely in your browser: no account, no tracking, no backend.
        </p>
      </footer>
    </div>
  );
}
