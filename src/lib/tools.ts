import toolsData from '../data/tools.json';

export interface ToolInfo {
  name: string;
  vendor: string;
  license: 'open_source' | 'proprietary';
  licenseName?: string;
  url: string;
}

/** The tools GridLens tracks (src/data/tools.json); sync_dataset.py publishes only these. */
export const TOOLS = toolsData as ToolInfo[];
const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export function toolInfo(name: string): ToolInfo | undefined {
  return BY_NAME.get(name);
}

export function isOpenSource(name: string): boolean {
  return BY_NAME.get(name)?.license === 'open_source';
}

export const LICENSE_LABELS: Record<string, string> = {
  open_source: 'Open source',
  proprietary: 'Proprietary',
};
