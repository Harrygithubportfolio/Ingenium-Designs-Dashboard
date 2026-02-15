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
      <div className="h-48 flex items-center justify-center bg-[#14141a] rounded-xl border border-[#2a2a33]">
        <p className="text-xs text-gray-600">
          {data.length === 0 ? 'No data to chart' : 'Need at least 2 sessions to show a chart'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-48 bg-[#14141a] rounded-xl border border-[#2a2a33] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a33" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#2a2a33' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#2a2a33' }}
            unit="kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a22',
              border: '1px solid #2a2a33',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#3b82f6' }}
            formatter={(value: unknown, name: unknown) => {
              if (name === 'maxWeight') return [`${value} kg`, 'Max Weight'];
              return [String(value), String(name)];
            }}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
            activeDot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#1a1a22' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
