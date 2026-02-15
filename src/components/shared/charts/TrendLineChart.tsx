'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TrendLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  colour?: string;
  height?: number;
  yDomain?: [number | 'auto', number | 'auto'];
  formatY?: (value: number) => string;
  formatX?: (value: string) => string;
  className?: string;
}

export default function TrendLineChart({
  data,
  xKey,
  yKey,
  colour = 'var(--accent)',
  height = 200,
  yDomain,
  formatY,
  formatX,
  className = '',
}: TrendLineChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatX}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            tickFormatter={formatY}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
            formatter={(value?: number) => [value != null && formatY ? formatY(value) : (value ?? ''), '']}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={colour}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: colour, stroke: 'var(--bg-card)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
