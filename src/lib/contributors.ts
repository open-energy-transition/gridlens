import data from '../data/contributors.json';

interface RawOrg {
  name: string;
  url: string;
  /** One entry per person: merged pull requests per month ("2025-03"). */
  people: Record<string, number>[];
}

export interface ToolContributors {
  githubOrgs: string[];
  repositories: number;
  contributors: number;
  /** Contributors whose GitHub profile names an organization. */
  affiliated: number;
  organizations: RawOrg[];
}

/** GitHub contribution data per open-source tool (scripts/fetch_contributors.py). */
export const CONTRIBUTORS = data as unknown as { generated: string; tools: Record<string, ToolContributors> };

export const UNAFFILIATED = 'unaffiliated';

export interface ContributorOrg {
  name: string;
  url: string;
  /** Pull requests merged in the window. */
  prs: number;
  /** People with at least one merged pull request in the window. */
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
 * Organizations by pull requests merged in the last `months` months, across the given tools; people
 * without an organization are left out. An organization present in several tools is added up.
 */
export function contributorsInWindow(tools: string[], months: number, source = CONTRIBUTORS): ContributorOrg[] {
  const from = windowStart(months, source.generated);
  const byName = new Map<string, ContributorOrg>();
  for (const tool of tools) {
    for (const o of source.tools[tool]?.organizations ?? []) {
      if (o.name === UNAFFILIATED) continue;
      let prs = 0;
      let people = 0;
      for (const p of o.people) {
        const n = Object.entries(p).reduce((sum, [month, c]) => (month >= from ? sum + c : sum), 0);
        prs += n;
        people += n > 0 ? 1 : 0;
      }
      if (!prs) continue;
      const e = byName.get(o.name) ?? { name: o.name, url: o.url, prs: 0, people: 0, tools: [] };
      e.prs += prs;
      e.people += people;
      e.url = e.url || o.url;
      e.tools.push(tool);
      byName.set(o.name, e);
    }
  }
  return [...byName.values()].sort((a, b) => b.prs - a.prs || a.name.localeCompare(b.name));
}

/** Window lengths offered by the slider, in months. */
export const WINDOWS = [3, 6, 12, 24, 36, 60, 120];

export function windowLabel(months: number): string {
  return months < 12 ? `${months} months` : months === 12 ? '12 months' : `${months / 12} years`;
}
