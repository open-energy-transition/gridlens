import { Search } from 'lucide-react';

export default function Hero() {
  return (
    <div className="mb-8 border-b border-ink-800 pb-8">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-400">
        <Search size={14} strokeWidth={2} />
        Purpose
      </p>
      <h1 className="font-display max-w-3xl text-3xl font-semibold leading-tight text-ink-50 sm:text-4xl">
        See who&rsquo;s using which energy models, where, and for what grid decisions.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-400">
        GridLens tracks real-world adoption of energy system modelling tools —
        PLEXOS, PyPSA, and dozens more — across institutions and countries
        worldwide. Every entry records the organization&rsquo;s role (direct
        user, consultant, funder, researcher), the grid decision it informs,
        and the evidence behind the claim, so funders and practitioners can
        see where open and commercial tools are actually shaping energy
        planning.
      </p>
    </div>
  );
}
