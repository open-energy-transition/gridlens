import { useMemo, useState } from 'react';
import {
  Landmark,
  LineChart,
  Network,
  Gauge,
  Leaf,
  TrendingUp,
  ScrollText,
  GraduationCap,
  Briefcase,
  HelpCircle,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import type { CatalogueRecord } from '../types';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { IMPACT_INFO, IMPACT_ORDER, impactOf, type Impact } from '../lib/impact';
import { orgGroup, orgGroupLabel } from '../lib/orgTypes';

interface GridDecisionsProps {
  records: CatalogueRecord[];
}

const DECISION_ICONS: Record<string, LucideIcon> = {
  'Capacity & Resource Planning': TrendingUp,
  'Unit Commitment & Dispatch': Gauge,
  'Market Operations & Price Formation': LineChart,
  'Transmission & Network Planning': Network,
  'Renewable Integration & Decarbonization': Leaf,
  'Forecasting & Scenario Analysis': ScrollText,
  'Policy & Regulatory Analysis': Landmark,
  'Academic & Research Studies': GraduationCap,
  'Independent & Commissioned Studies': Briefcase,
  'Other / General Modeling': HelpCircle,
};

const DECISION_DESCRIPTIONS: Record<string, string> = {
  'Capacity & Resource Planning': 'Long-term generation/resource investment and adequacy decisions.',
  'Unit Commitment & Dispatch': 'Short-term operational scheduling and dispatch of generating units.',
  'Market Operations & Price Formation': 'Wholesale market clearing, price formation, and market design.',
  'Transmission & Network Planning': 'Grid/network expansion, interconnection, and connection studies.',
  'Renewable Integration & Decarbonization': 'Renewable integration, decarbonization and net-zero pathway studies.',
  'Forecasting & Scenario Analysis': 'Demand/supply forecasting and scenario generation.',
  'Policy & Regulatory Analysis': 'Policy design, regulatory review, and government energy planning.',
  'Academic & Research Studies': 'Academic and research-institution studies of power systems.',
  'Independent & Commissioned Studies': 'Third-party consulting, vendor, or commissioned engagements.',
  'Other / General Modeling': 'General-purpose modeling not cleanly matching another category.',
};

function groupByDecisionType(records: CatalogueRecord[]) {
  const groups = new Map<string, CatalogueRecord[]>();
  for (const r of records) {
    const key = r.decision_type || 'Other / General Modeling';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
}

const PAGE = 3;
const MORE = 6;

const IMPACT_STYLE: Record<Impact, string> = {
  high: 'bg-emerald-500/15 text-emerald-400',
  medium: 'bg-sky-500/15 text-sky-400',
  low: 'bg-ink-800 text-ink-400',
};

function ImpactBadge({ impact }: { impact: Impact }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${IMPACT_STYLE[impact]}`}
      title={IMPACT_INFO[impact].description}
    >
      {IMPACT_INFO[impact].label}
    </span>
  );
}

/** Highest impact first; within a level, documented use cases with a summary first. */
function rankExamples(records: CatalogueRecord[]) {
  const score = (r: CatalogueRecord) =>
    IMPACT_ORDER.indexOf(impactOf(r)) * 4 + (r.decision_basis === 'documented' ? 0 : 2) + (r.summary.trim() ? 0 : 1);
  return [...records].sort((a, b) => score(a) - score(b));
}

function DecisionCard({ decisionType, records }: { decisionType: string; records: CatalogueRecord[] }) {
  const Icon = DECISION_ICONS[decisionType] ?? HelpCircle;
  const ranked = useMemo(() => rankExamples(records), [records]);
  const byImpact = useMemo(() => {
    const c: Record<Impact, number> = { high: 0, medium: 0, low: 0 };
    for (const r of records) c[impactOf(r)] += 1;
    return c;
  }, [records]);
  const [shown, setShown] = useState(PAGE);
  const examples = ranked.slice(0, shown);

  return (
    <Card>
      <div className="mb-3 flex items-start gap-3">
        <div className="rounded-lg bg-brand-500/10 p-2 text-brand-400">
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-ink-100">{decisionType}</h3>
            <span className="shrink-0 rounded-full bg-ink-800 px-2 py-0.5 text-xs font-semibold text-ink-300">
              {records.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">{DECISION_DESCRIPTIONS[decisionType] ?? ''}</p>
          <p className="mt-1.5 text-xs text-ink-500">
            {IMPACT_ORDER.filter((i) => byImpact[i]).map((i, k) => (
              <span key={i}>
                {k > 0 && ' · '}
                <span className="tabular-nums text-ink-300">{byImpact[i]}</span> {IMPACT_INFO[i].label.toLowerCase()}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {examples.map((r, i) => {
          const text = r.summary.trim() || r.use_case.trim();
          return (
            <div key={i} className="rounded-lg border border-ink-800 bg-ink-950/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-ink-200">{r.institution_name}</span>
                <ImpactBadge impact={impactOf(r)} />
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {r.tool_name} · {r.country_label} · {orgGroupLabel(orgGroup(r))}
                {r.decision_basis !== 'documented' && (
                  <span title="The grid decision was inferred, not stated in the source"> · decision inferred</span>
                )}
              </div>
              {text && <p className="mt-2 text-sm leading-relaxed text-ink-300">{text}</p>}
              {r.source_link && (
                <a
                  href={r.source_link.split(';')[0].trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                >
                  View source <ExternalLink size={11} />
                </a>
              )}
            </div>
          );
        })}
      </div>
      {ranked.length > PAGE && (
        <div className="mt-3 flex gap-3 text-xs font-medium">
          {shown < ranked.length && (
            <button type="button" onClick={() => setShown((n) => n + MORE)} className="text-brand-400 hover:text-brand-300">
              Show {Math.min(MORE, ranked.length - shown)} more of {ranked.length - shown}
            </button>
          )}
          {shown > PAGE && (
            <button type="button" onClick={() => setShown(PAGE)} className="text-ink-400 hover:text-ink-200">
              Show less
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

export default function GridDecisions({ records }: GridDecisionsProps) {
  const groups = useMemo(() => groupByDecisionType(records), [records]);

  return (
    <div>
      <SectionHeader
        title="Grid Decisions"
        description="What grid decisions each tool is actually used for, with the highest-impact examples first. Filter by tool, country or organization type above to see what your peers did."
      />
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-400">
        {IMPACT_ORDER.map((i) => (
          <span key={i} className="flex items-center gap-2">
            <ImpactBadge impact={i} />
            {IMPACT_INFO[i].description}
          </span>
        ))}
      </div>
      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map(([decisionType, decisionRecords]) => (
            <DecisionCard key={decisionType} decisionType={decisionType} records={decisionRecords} />
          ))}
        </div>
      )}
    </div>
  );
}
