import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Globe2,
  Wrench,
  Building2,
  Users,
  Table2,
  Info,
  History,
} from 'lucide-react';
import type { Section } from '../../types';
import GitHubIcon from '../common/GitHubIcon';

interface NavItem {
  id: Section;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'geographic', label: 'Geographic Analysis', icon: Globe2 },
  { id: 'tools', label: 'Tools & Categories', icon: Wrench },
  { id: 'institutions', label: 'Institutions', icon: Building2 },
  { id: 'top-users', label: 'Top Users by Tool', icon: Users },
  { id: 'records', label: 'Records & Export', icon: Table2 },
  { id: 'changelog', label: 'Changelog', icon: History },
  { id: 'about', label: 'About', icon: Info },
];

interface SidebarProps {
  active: Section;
  onSelect: (s: Section) => void;
  open: boolean;
}

export default function Sidebar({ active, onSelect, open }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-950 transition-transform duration-200 md:static md:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-3 border-b border-ink-800 px-5 py-5">
        <img src="/brand/app-logo.svg" alt="GridLens logo" className="h-10 w-10 shrink-0 rounded-[10px]" />
        <p className="font-display min-w-0 flex-1 truncate text-xl font-semibold tracking-tight text-ink-50">
          GridLens
        </p>
        <a
          href="https://github.com/open-energy-transition/esm-usage-catalog"
          target="_blank"
          rel="noreferrer"
          aria-label="View source data on GitHub"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-900 hover:text-ink-200"
        >
          <GitHubIcon size={18} />
        </a>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                  : 'border-transparent text-ink-400 hover:bg-ink-900 hover:text-ink-200'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-ink-800 px-5 py-3">
        <p className="text-xs text-ink-600">Client-side only &middot; 509 records</p>
      </div>
      <a
        href="https://openenergytransition.org/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 border-t border-ink-800 px-5 py-3 text-ink-500 transition-colors hover:text-ink-300"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm ring-1 ring-black/5">
          <img src="/brand/oet-mark-only.svg" alt="Open Energy Transition" className="h-full w-full object-contain" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[10px] uppercase tracking-wide">Built by Open Energy Transition</span>
          <span className="block truncate text-[10px] text-sage-500">Accelerating the energy transition</span>
        </span>
      </a>
    </aside>
  );
}
