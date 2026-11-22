/**
 * The modelling categories a record can belong to. A record lists one or
 * more of them in `tool_category`, separated by "; " (a study can, for
 * example, plan capacity and then simulate its operation), or `unspecified`
 * when the source names the tool but not what it was used for.
 */
export interface CategoryInfo {
  id: string;
  label: string;
  description: string;
  examples: string;
}

export const TOOL_CATEGORIES: CategoryInfo[] = [
  {
    id: 'capacity_expansion',
    label: 'Capacity expansion',
    description:
      'Decides what to build and when: least-cost investment in generation, storage and transmission over years to decades, as in national expansion plans, integrated resource plans and net-zero pathways.',
    examples: 'PyPSA, PLEXOS (long-term), SDDP with OptGen, TIMES',
  },
  {
    id: 'production_cost',
    label: 'Production cost',
    description:
      'Simulates how a given system is operated, often hour by hour: unit commitment and economic dispatch, market prices, hydro-thermal scheduling, adequacy and reliability.',
    examples: 'PLEXOS, PyPSA, PROMOD, Bid3, SDDP, NEWAVE / DECOMP / DESSEM',
  },
  {
    id: 'power_flow_dynamics',
    label: 'Power flow & dynamics',
    description:
      'Models the physics of the network: load flow, N-1 contingency, short-circuit, stability and RMS/EMT dynamics, as in grid-connection and transmission or distribution network studies.',
    examples: 'PSS/E, PowerFactory, PSCAD',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Supporting models outside the three domains, such as weather, inflow and demand forecasting or tariff models.',
    examples: 'Previvaz, WRF, MYTO tariff model',
  },
  {
    id: 'unspecified',
    label: 'Unspecified',
    description:
      'The source confirms the organization uses the tool but not what for, for example a licence purchase, a client list or a job posting. Many tools serve several of the purposes above (PLEXOS and PyPSA both cover capacity expansion and production cost), so the tool name alone does not tell us.',
    examples: '',
  },
];

const BY_ID = new Map(TOOL_CATEGORIES.map((c) => [c.id, c]));

/** "capacity_expansion; production_cost" -> ["capacity_expansion", "production_cost"] */
export function splitCategories(value: string | undefined | null): string[] {
  return (value ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function categoryLabel(id: string): string {
  return BY_ID.get(id)?.label ?? id;
}
