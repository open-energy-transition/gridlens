import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Cell } from 'recharts';
import { PALETTE, CHART_GRID, CHART_AXIS, CHART_TICK, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER, CHART_TOOLTIP_TEXT, CHART_CURSOR } from '../../lib/colors';

interface VerticalBarChartProps {
  data: { name: string; count: number }[];
  height?: number;
}

export default function VerticalBarChart({ data, height = 320 }: VerticalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 32, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={CHART_AXIS}
          tick={{ fill: CHART_TICK, fontSize: 11 }}
          angle={-30}
          textAnchor="end"
          interval={0}
          height={60}
        />
        <YAxis stroke={CHART_AXIS} tick={{ fill: CHART_TICK, fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}`, borderRadius: 8, color: CHART_TOOLTIP_TEXT }}
          cursor={{ fill: CHART_CURSOR }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
