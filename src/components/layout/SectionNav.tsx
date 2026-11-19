import { useEffect, useState } from 'react';
import { SECTIONS, type SectionId } from '../../lib/routes';
import GitHubIcon from '../common/GitHubIcon';

/** Scrolls to a section and records it in the address bar (#decisions) without adding history entries. */
export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}`);
}

/** Top bar: logo, and a sticky row of section links that highlights the section in view. */
export default function SectionNav() {
  const [current, setCurrent] = useState<SectionId>('adoption');

  useEffect(() => {
    const seen = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setCurrent(top.target.id as SectionId);
      },
      { rootMargin: '-120px 0px -60% 0px' },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) seen.observe(el); });
    return () => seen.disconnect();
  }, []);

  useEffect(() => {
    document.getElementById(`nav-${current}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current]);

  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-4 md:px-8">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/brand/app-logo.svg" alt="" className="h-9 w-9 rounded-[10px]" />
          <span className="font-display text-xl font-semibold tracking-tight text-ink-50">GridLens</span>
        </a>
        <a
          href="https://github.com/open-energy-transition/gridlens"
          target="_blank"
          rel="noreferrer"
          aria-label="GridLens on GitHub"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-900 hover:text-ink-200"
        >
          <GitHubIcon />
        </a>
      </header>
      <nav aria-label="Sections" className="sticky top-0 z-20 mt-3 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] md:px-8">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                id={`nav-${s.id}`}
                href={`#${s.id}`}
                onClick={(e) => { e.preventDefault(); scrollToSection(s.id); }}
                aria-current={current === s.id ? 'true' : undefined}
                className={`block rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  current === s.id ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:text-ink-100'
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
