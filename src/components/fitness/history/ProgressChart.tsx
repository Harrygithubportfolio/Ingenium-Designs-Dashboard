'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  bestSet: string;
}

interface Props {
  data: DataPoint[];
}

export default function ProgressChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center bg-inner rounded-xl border border-edge">
        <p className="text-xs text-dim">
          {data.length === 0 ? 'No data to chart' : 'Need at least 2 sessions to show a chart'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-48 bg-inner rounded-xl border border-edge p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
            unit="kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            itemStyle={{ color: 'var(--accent)' }}
            formatter={(value: unknown, name: unknown) => {
              if (name === 'maxWeight') return [`${value} kg`, 'Max Weight'];
              return [String(value), String(name)];
            }}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
            activeDot={{ fill: 'var(--accent)', r: 6, strokeWidth: 2, stroke: 'var(--bg-card)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
