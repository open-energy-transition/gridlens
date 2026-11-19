import data from '../data/contributors.json';
import { TOOLS } from './tools';

export interface ContributorOrg {
  name: string;
  /** People with at least one merged pull request. */
  contributors: number;
  mergedPRs: number;
  /** Pull requests merged in the last 24 months. */
  recentPRs: number;
}

export interface ToolContributors {
  githubOrg: string;
  repositories: number;
  contributors: number;
  /** Contributors whose GitHub profile names an organization. */
  affiliated: number;
  organizations: ContributorOrg[];
}

/** GitHub contribution statistics per open-source tool (scripts/fetch_contributors.py). */
export const CONTRIBUTORS = data as { generated: string; tools: Record<string, ToolContributors> };

export const UNAFFILIATED = 'unaffiliated';

/** Organizations behind one tool's code, most recently merged pull requests first; people without an organization are left out. */
export function contributingOrgs(tool: string): ContributorOrg[] {
  return (CONTRIBUTORS.tools[tool]?.organizations ?? []).filter((o) => o.name !== UNAFFILIATED);
}

export interface Builder extends ContributorOrg {
  tools: string[];
}

/** Organizations across all open-source tools, by pull requests merged in the last 24 months (all-time count breaks ties). */
export function builders(tools: string[] = TOOLS.map((t) => t.name)): Builder[] {
  const byName = new Map<string, Builder>();
  for (const tool of tools) {
    for (const o of contributingOrgs(tool)) {
      const b = byName.get(o.name) ?? { name: o.name, contributors: 0, mergedPRs: 0, recentPRs: 0, tools: [] };
      b.contributors += o.contributors;
      b.mergedPRs += o.mergedPRs;
      b.recentPRs += o.recentPRs;
      b.tools.push(tool);
      byName.set(o.name, b);
    }
  }
  return [...byName.values()].sort((a, b) => b.recentPRs - a.recentPRs || b.mergedPRs - a.mergedPRs || a.name.localeCompare(b.name));
}
