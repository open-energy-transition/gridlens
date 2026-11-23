import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, PAGES, SECTIONS, slug, type Route } from '../../lib/router';
import { TOOLS } from '../../lib/tools';
import ToolLogo from '../common/ToolLogo';
import GitHubIcon from '../common/GitHubIcon';

const REPO = 'https://github.com/open-energy-transition/gridlens';
export const SUGGEST_URL = `${REPO}/issues/new/choose`;

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

const TOP = [
  { path: '/', label: 'Overview' },
  { path: '/organizations', label: 'Organizations' },
  { path: '/projects', label: 'Projects & data' },
];
const ABOUT = PAGES.filter((p) => p.path.startsWith('/about'));
const SORTED_TOOLS = [...TOOLS].sort((a, b) => Number(b.license === 'open_source') - Number(a.license === 'open_source') || a.name.localeCompare(b.name));

function ToolItems({ onPick }: { onPick?: () => void }) {
  return (
    <>
      {(['open_source', 'proprietary'] as const).map((lic) => (
        <div key={lic}>
          <p className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-[0.14em] text-ink-500">{lic === 'open_source' ? 'Open source' : 'Proprietary'}</p>
          <ul className="grid grid-cols-2 gap-0.5">
            {SORTED_TOOLS.filter((t) => t.license === lic).map((t) => (
              <li key={t.name}>
                <Link href={`/tools/${slug(t.name)}`} onClick={onPick} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-ink-200 hover:bg-ink-800/70 hover:text-ink-50">
                  <ToolLogo name={t.name} size={22} />
                  <span className="truncate">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Header button with a dropdown panel; closes on outside click, Escape and navigation. */
function Dropdown({ label, active, children, width = 'w-56' }: { label: string; active: boolean; children: (close: () => void) => ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', off);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', off); window.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors ${active || open ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:text-ink-100'}`}>
        {label}<ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`absolute left-0 top-full z-40 mt-2 ${width} rounded-2xl border border-ink-800 bg-ink-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-md`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function navClass(active: boolean) {
  return `block rounded-full px-3 py-1.5 text-sm transition-colors ${active ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:text-ink-100'}`;
}

/**
 * Page frame: a top bar with the site's pages (a menu on phones), and on the overview a small
 * section index on the left, as on artificialanalysis.ai. Content is wide on large screens.
 */
export default function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const isOverview = route.page === '/';
  const current = useCurrentSection(isOverview);

  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; }, [menu]);

  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-ink-800/70 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GridLens home">
            <img src="/brand/app-logo.svg" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-[1.35rem] font-medium tracking-tight text-ink-50">GridLens</span>
          </Link>
          <nav aria-label="Pages" className="ml-4 hidden items-center gap-1 lg:flex">
            <Link href="/" className={navClass(route.page === '/')}>Overview</Link>
            <Dropdown label="Tools" active={route.page === '/tools'} width="w-[26rem]">
              {(close) => <ToolItems onPick={close} />}
            </Dropdown>
            {TOP.slice(1).map((p) => <Link key={p.path} href={p.path} className={navClass(route.page === p.path)}>{p.label}</Link>)}
            <Dropdown label="About" active={route.page.startsWith('/about')}>
              {(close) => (
                <ul>
                  {ABOUT.map((p) => (
                    <li key={p.path}><Link href={p.path} onClick={close} className="block rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-ink-800/70 hover:text-ink-50">{p.label}</Link></li>
                  ))}
                </ul>
              )}
            </Dropdown>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={SUGGEST_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-ink-700 px-3.5 py-1.5 text-sm text-ink-200 transition-colors hover:border-brand-500/70 hover:text-ink-50 sm:block"
            >
              Suggest an edit
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
          <nav aria-label="Pages" className="h-[calc(100vh-3.5rem)] overflow-y-auto px-4 pb-10 pt-2">
            <ul className="space-y-1">
              {TOP.map((p) => (
                <li key={p.path}><Link href={p.path} onClick={() => setMenu(false)} className={`${navClass(route.page === p.path)} py-2.5 text-base`}>{p.label}</Link></li>
              ))}
            </ul>
            <p className="mt-6 px-3 text-xs uppercase tracking-[0.14em] text-ink-500">Tools</p>
            <ToolItems onPick={() => setMenu(false)} />
            <p className="mt-6 px-3 text-xs uppercase tracking-[0.14em] text-ink-500">About</p>
            <ul className="mt-1 space-y-1">
              {ABOUT.map((p) => (
                <li key={p.path}><Link href={p.path} onClick={() => setMenu(false)} className={`${navClass(route.page === p.path)} py-2.5 text-base`}>{p.label}</Link></li>
              ))}
            </ul>
            <a href={SUGGEST_URL} target="_blank" rel="noreferrer" className="mt-6 block rounded-full border border-ink-700 px-4 py-2.5 text-center text-ink-200">
              Suggest an edit
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
            <Link href="/about" className="hover:text-ink-200">Methodology</Link>
            <Link href="/about/changelog" className="hover:text-ink-200">Changelog</Link>
            <Link href="/projects" className="hover:text-ink-200">Download data</Link>
            <Link href="/about/contact" className="hover:text-ink-200">Contact</Link>
            <a href="https://www.openenergytransition.org/imprint" target="_blank" rel="noreferrer" className="hover:text-ink-200">Imprint</a>
            <a href={REPO} target="_blank" rel="noreferrer" className="hover:text-ink-200">GitHub</a>
          </nav>
        </div>
        <p className="mx-auto max-w-[1440px] px-4 pb-8 text-xs text-ink-600 md:px-6">
          No cookies, no tracking. Product names and logos are trademarks of their owners, used only to identify the tools;
          GridLens is independent and not endorsed by any vendor.{' '}
          <Link href="/about/legal" className="underline decoration-ink-700 underline-offset-2 hover:text-ink-300">Legal &amp; privacy</Link>
        </p>
      </footer>
    </div>
  );
}
