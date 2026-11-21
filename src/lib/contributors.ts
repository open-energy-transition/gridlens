import data from '../data/contributors.json';

/** Kinds of contribution counted per person and month. */
export const METRICS = [
  { id: 'prs', label: 'Merged PRs', unit: 'merged PRs', description: 'Pull requests merged into the code' },
  { id: 'commits', label: 'Commits', unit: 'commits', description: 'Commits on the main branch (GitHub counts the top 100 authors per repository)' },
  { id: 'reviews', label: 'Reviews', unit: 'reviews', description: 'Reviews of other people’s pull requests' },
  { id: 'issues', label: 'Issues', unit: 'issues', description: 'Issues opened: bug reports, questions and feature requests' },
] as const;

export type Metric = (typeof METRICS)[number]['id'];

interface RawOrg {
  name: string;
  url: string;
  /** One entry per person: per kind of contribution, counts per month ("2025-03"). */
  people: Partial<Record<Metric, Record<string, number>>>[];
}

export interface ToolContributors {
  githubOrgs: string[];
  repositories: number;
  contributors: number;
  /** Contributors whose GitHub profile names an organization. */
  affiliated: number;
  organizations: RawOrg[];
}

type Person = RawOrg['people'][number];

/** Monthly counts of one kind for a person. Older data held only merged PRs, as a plain month map. */
function monthly(p: Person, metric: Metric): Record<string, number> {
  const legacy = !METRICS.some((m) => m.id in p);
  return (legacy ? (metric === 'prs' ? (p as Record<string, number>) : {}) : p[metric]) ?? {};
}

/** GitHub contribution data per open-source tool (scripts/fetch_contributors.py). */
export const CONTRIBUTORS = data as unknown as { generated: string; tools: Record<string, ToolContributors> };

/** Kinds of contribution present in the data (the switch offers only these). */
export const AVAILABLE_METRICS = METRICS.filter((m) =>
  Object.values(CONTRIBUTORS.tools).some((t) => t.organizations.some((o) => o.people.some((p) => Object.keys(monthly(p, m.id)).length))));

export const UNAFFILIATED = 'unaffiliated';

export interface ContributorOrg {
  name: string;
  url: string;
  /** Contributions of the chosen kind in the window. */
  count: number;
  /** People with at least one such contribution in the window. */
  people: number;
  /** Tools they contributed to in the window. */
  tools: string[];
}

/** First month ("2025-03") of a window of `months` months ending with the month of `generated`. */
export function windowStart(months: number, generated = CONTRIBUTORS.generated): string {
  const end = generated ? new Date(`${generated.slice(0, 7)}-01T00:00:00Z`) : new Date();
  end.setUTCMonth(end.getUTCMonth() - months + 1);
  return end.toISOString().slice(0, 7);
}

/**
 * Organizations by contributions of one kind (merged PRs by default) in the last `months` months, across the
 * given tools; people without an organization are left out. An organization present in several tools is added up.
 */
export function contributorsInWindow(tools: string[], months: number, source = CONTRIBUTORS, metric: Metric = 'prs'): ContributorOrg[] {
  const from = windowStart(months, source.generated);
  const byName = new Map<string, ContributorOrg>();
  for (const tool of tools) {
    for (const o of source.tools[tool]?.organizations ?? []) {
      if (o.name === UNAFFILIATED) continue;
      let prs = 0;
      let people = 0;
      for (const p of o.people) {
        const n = Object.entries(monthly(p, metric)).reduce((sum, [month, c]) => (month >= from ? sum + c : sum), 0);
        prs += n;
        people += n > 0 ? 1 : 0;
      }
      if (!prs) continue;
      const e = byName.get(o.name) ?? { name: o.name, url: o.url, count: 0, people: 0, tools: [] };
      e.count += prs;
      e.people += people;
      e.url = e.url || o.url;
      e.tools.push(tool);
      byName.set(o.name, e);
    }
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Window lengths offered by the slider, in months. */
export const WINDOWS = [3, 6, 12, 24, 36, 60, 120];

export function windowLabel(months: number): string {
  return months < 12 ? `${months} months` : months === 12 ? '12 months' : `${months / 12} years`;
}
