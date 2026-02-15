'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface BarChartCardProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  colour?: string;
  height?: number;
  formatY?: (value: number) => string;
  formatX?: (value: string) => string;
  className?: string;
}

export default function BarChartCard({
  data,
  xKey,
  yKey,
  colour = 'var(--accent)',
  height = 200,
  formatY,
  formatX,
  className = '',
}: BarChartCardProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} vertical={false} />
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
            cursor={{ fill: 'var(--accent-subtle)' }}
          />
          <Bar dataKey={yKey} fill={colour} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
