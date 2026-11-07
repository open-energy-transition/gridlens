import { useMemo } from 'react';
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

function exampleRecordsFor(records: CatalogueRecord[]): CatalogueRecord[] {
  // Prefer records with real documented evidence (a quote) over inferred ones.
  const documented = records.filter((r) => r.decision_basis === 'documented' && r.exact_snippet_or_quote.trim());
  const documentedNoQuote = records.filter((r) => r.decision_basis === 'documented' && !r.exact_snippet_or_quote.trim());
  const inferred = records.filter((r) => r.decision_basis !== 'documented');
  return [...documented, ...documentedNoQuote, ...inferred].slice(0, 3);
}

function DecisionCard({ decisionType, records }: { decisionType: string; records: CatalogueRecord[] }) {
  const Icon = DECISION_ICONS[decisionType] ?? HelpCircle;
  const examples = useMemo(() => exampleRecordsFor(records), [records]);

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
        </div>
      </div>

      <div className="space-y-3">
        {examples.map((r, i) => {
          const snippet = r.exact_snippet_or_quote.trim() || r.use_case.trim();
          return (
            <div key={i} className="rounded-lg border border-ink-800 bg-ink-950/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink-200" title={r.institution_name}>
                  {r.institution_name}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    r.decision_basis === 'documented'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}
                  title={
                    r.decision_basis === 'documented'
                      ? 'Classified from a documented, source-quoted use case'
                      : 'Inferred from the organization type -- not a documented use case'
                  }
                >
                  {r.decision_basis === 'documented' ? 'Documented' : 'Inferred'}
                </span>
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {r.tool_name} · {r.country_label}
              </div>
              {snippet && <p className="mt-2 line-clamp-3 text-xs text-ink-400">&ldquo;{snippet}&rdquo;</p>}
              {r.source_link && (
                <a
                  href={r.source_link}
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
    </Card>
  );
}

export default function GridDecisions({ records }: GridDecisionsProps) {
  const groups = useMemo(() => groupByDecisionType(records), [records]);

  return (
    <div>
      <SectionHeader
        title="Grid Decisions"
        description="What grid decisions is each tool actually used for -- capacity planning, dispatch, market operations, and more. Filter by tool or country above to see how the picture changes."
      />
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
