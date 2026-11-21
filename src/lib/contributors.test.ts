import { describe, expect, it } from 'vitest';
import { contributorsInWindow, windowStart, type ToolContributors } from './contributors';

const tool = (orgs: ToolContributors['organizations']): ToolContributors =>
  ({ githubOrgs: ['x'], repositories: 1, contributors: 3, affiliated: 2, organizations: orgs });

const source = {
  generated: '2026-11-19',
  tools: {
    A: tool([
      { name: 'OET', url: 'https://oet', people: [{ prs: { '2026-10': 5, '2020-01': 50 }, reviews: { '2026-09': 3 } }, { prs: { '2019-05': 9 } }] },
      { name: 'unaffiliated', url: '', people: [{ prs: { '2026-11': 7 } }] },
    ]),
    B: tool([{ name: 'OET', url: '', people: [{ prs: { '2026-01': 2 } }] }, { name: 'Uni', url: '', people: [{ prs: { '2025-12': 4 } }] }]),
  },
};

describe('contribution window', () => {
  it('ends with the month the data was fetched', () => {
    expect(windowStart(12, '2026-11-19')).toBe('2025-12');
    expect(windowStart(1, '2026-11-19')).toBe('2026-11');
  });

  it('counts only pull requests and people active in the window, without the unaffiliated', () => {
    expect(contributorsInWindow(['A'], 12, source)).toEqual([{ name: 'OET', url: 'https://oet', count: 5, people: 1, tools: ['A'] }]);
  });

  it('adds an organization up across tools and ranks by pull requests', () => {
    expect(contributorsInWindow(['A', 'B'], 12, source).map((o) => [o.name, o.count, o.tools])).toEqual([
      ['OET', 7, ['A', 'B']],
      ['Uni', 4, ['B']],
    ]);
    expect(contributorsInWindow(['A'], 120, source)[0].count).toBe(64);
  });

  it('counts the chosen kind of contribution', () => {
    expect(contributorsInWindow(['A'], 12, source, 'reviews')).toEqual([{ name: 'OET', url: 'https://oet', count: 3, people: 1, tools: ['A'] }]);
  });
});
