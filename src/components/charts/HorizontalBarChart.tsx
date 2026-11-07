import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colorFor, CHART_GRID, CHART_AXIS, CHART_TICK, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER, CHART_TOOLTIP_TEXT, CHART_CURSOR } from '../../lib/colors';

interface HorizontalBarChartProps {
  data: { name: string; count: number }[];
  height?: number;
  colorIndex?: number;
}

export default function HorizontalBarChart({ data, height = 420, colorIndex = 0 }: HorizontalBarChartProps) {
  const fill = colorFor(colorIndex);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
        <XAxis type="number" stroke={CHART_AXIS} tick={{ fill: CHART_TICK, fontSize: 12 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={200}
          stroke={CHART_AXIS}
          tick={{ fill: '#bdbdbd', fontSize: 12 }}
          interval={0}
        />
        <Tooltip
          contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}`, borderRadius: 8, color: CHART_TOOLTIP_TEXT }}
          cursor={{ fill: CHART_CURSOR }}
        />
        <Bar dataKey="count" fill={fill} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
