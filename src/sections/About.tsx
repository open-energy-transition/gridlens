import { ExternalLink, Database, ShieldCheck, Search } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import GitHubIcon from '../components/common/GitHubIcon';

const GITHUB_URL = 'https://github.com/open-energy-transition/esm-usage-catalog';

export default function About() {
  return (
    <div>
      <SectionHeader
        title="About GridLens"
        description="What this catalogue is, how it's built, and where the data comes from."
      />

      <Card className="mb-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-400">
          <Search size={14} strokeWidth={2} />
          Purpose
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-300">
          GridLens exists to answer a simple question funders, researchers, and
          practitioners keep asking: <em>who is actually using which energy
          system modelling tools, where, and for what grid decision?</em> Open
          and commercial tools (PLEXOS, PyPSA, and dozens more) get built,
          funded, and promoted — but visibility into real-world adoption is
          fragmented across case studies, procurement notices, conference
          decks, and job postings. GridLens brings that evidence together in
          one searchable, filterable place.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="How it's built">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-brand-400" />
            <p className="text-sm leading-relaxed text-ink-400">
              Every record is tied to a role (direct user, commissioner,
              consultant, researcher, subject of study) and an evidence
              strength, sourced from public documents, procurement records,
              vendor case studies, and verifiable staff/organization
              statements — not inference alone. Ambiguous or weakly-evidenced
              claims are flagged rather than silently dropped.
            </p>
          </div>
        </Card>

        <Card title="Data sources">
          <div className="flex items-start gap-3">
            <Database size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-brand-400" />
            <p className="text-sm leading-relaxed text-ink-400">
              GridLens combines the{' '}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sage-400 underline decoration-sage-700 hover:text-sage-300"
              >
                esm-usage-catalog
              </a>{' '}
              dataset with an independent, more extensive worldwide catalogue
              of organizations using PLEXOS specifically — merged into a
              single dataset of 509 records across 149 countries, with no
              backend: everything runs client-side against a static dataset.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-ink-200">
              Open source
            </p>
            <p className="mt-1 max-w-xl text-sm text-ink-500">
              The underlying dataset this tool builds on is public. Browse it,
              contribute corrections, or raise an issue on GitHub.
            </p>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm font-semibold text-ink-100 transition-colors hover:border-brand-500 hover:text-brand-300"
          >
            <GitHubIcon size={16} />
            View on GitHub
            <ExternalLink size={13} strokeWidth={1.75} className="opacity-60" />
          </a>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white p-1.5 shadow-sm ring-1 ring-black/5">
            <img src="/brand/oet-mark-only.svg" alt="Open Energy Transition" className="h-full w-full object-contain" />
          </span>
          <p className="text-sm text-ink-400">
            GridLens is built and maintained by{' '}
            <a
              href="https://openenergytransition.org/"
              target="_blank"
              rel="noreferrer"
              className="text-sage-400 underline decoration-sage-700 hover:text-sage-300"
            >
              Open Energy Transition
            </a>
            , a non-profit accelerating the energy transition through
            open-source energy system modelling.
          </p>
        </div>
      </Card>
    </div>
  );
}
