import { ArrowUpRight, Mail } from 'lucide-react';
import { SUGGEST_URL } from '../components/layout/Shell';
import AboutTabs from './AboutTabs';

const REPO = 'https://github.com/open-energy-transition/gridlens';

const WAYS = [
  { title: 'Suggest an edit', text: 'An entry that is wrong, a missing project, or a tool that belongs among the most used ones? Pick a form on GitHub and add a public source; a maintainer checks every suggestion.', href: SUGGEST_URL, label: 'Suggest on GitHub' },
  { title: 'Use or improve the code', text: 'GridLens is open source. The data, the research scripts and this website are on GitHub; contributions are welcome.', href: REPO, label: 'GitHub repository' },
  { title: 'Talk to the team', text: 'For partnerships, funding questions or anything else, write to Open Energy Transition.', href: 'mailto:info@openenergytransition.org', label: 'info@openenergytransition.org' },
];

export default function Contact() {
  return (
    <div>
      <AboutTabs current="/about/contact" />
      <h1 className="font-display mt-10 text-5xl text-ink-50">Contact</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-300">GridLens gets better with every correction and every project you point us to.</p>
      <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-800/80 bg-ink-800/80 md:grid-cols-3">
        {WAYS.map((w) => (
          <a key={w.title} href={w.href} target={w.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer" className="group flex flex-col gap-3 bg-ink-950/85 p-6 transition-colors hover:bg-ink-900">
            <p className="font-display text-2xl text-ink-50">{w.title}</p>
            <p className="text-sm leading-relaxed text-ink-400">{w.text}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm text-brand-300 group-hover:text-brand-200">
              {w.href.startsWith('mailto') ? <Mail size={15} /> : null}{w.label}{w.href.startsWith('mailto') ? null : <ArrowUpRight size={15} />}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
