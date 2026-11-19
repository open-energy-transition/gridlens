import { describe, expect, it } from 'vitest';
import { builders, contributingOrgs, CONTRIBUTORS, UNAFFILIATED } from './contributors';

describe('contributors', () => {
  it('never lists unaffiliated contributors as an organization', () => {
    for (const tool of Object.keys(CONTRIBUTORS.tools)) {
      expect(contributingOrgs(tool).some((o) => o.name === UNAFFILIATED || o.name === '')).toBe(false);
    }
  });

  it('adds up an organization across tools and ranks by recently merged pull requests', () => {
    const all = builders();
    for (let i = 1; i < all.length; i++) expect(all[i - 1].recentPRs).toBeGreaterThanOrEqual(all[i].recentPRs);
    for (const b of all) {
      const sum = b.tools.reduce((n, t) => n + (contributingOrgs(t).find((o) => o.name === b.name)?.recentPRs ?? 0), 0);
      expect(b.recentPRs).toBe(sum);
    }
  });
});
