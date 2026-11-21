import { describe, expect, it } from 'vitest';
import { rowsToCsv } from './csv';

describe('chart data as CSV', () => {
  it('writes the columns of the first row and quotes where needed', () => {
    expect(rowsToCsv([{ tool: 'PyPSA', organizations: 376 }, { tool: 'A, B', organizations: 2 }])).toBe('tool,organizations\nPyPSA,376\n"A, B",2');
    expect(rowsToCsv([])).toBe('');
  });
});
