import { describe, expect, it } from 'vitest';
import { withParam } from './urlState';

describe('view settings in the URL', () => {
  it('set a value, leave the default out and keep the other parameters', () => {
    expect(withParam('?country=Spain', 'sort', '-impact', 'tool_name')).toBe('?country=Spain&sort=-impact');
    expect(withParam('?country=Spain&sort=-impact', 'sort', 'tool_name', 'tool_name')).toBe('?country=Spain');
    expect(withParam('', 'purpose_show', 'count', 'count')).toBe('');
  });
});
