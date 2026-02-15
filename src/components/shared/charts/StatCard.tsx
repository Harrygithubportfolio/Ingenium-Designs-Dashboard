'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({ label, value, trend, icon, className = '' }: StatCardProps) {
  const trendColour =
    trend?.direction === 'up' ? 'text-green-400' :
    trend?.direction === 'down' ? 'text-red-400' :
    'text-dim';

  const trendArrow =
    trend?.direction === 'up' ? '\u2191' :
    trend?.direction === 'down' ? '\u2193' :
    '\u2192';

  return (
    <div className={`bg-gradient-to-br from-card to-inner rounded-xl border border-edge p-4 flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-dim uppercase tracking-wide">{label}</span>
        {icon && <span className="text-accent">{icon}</span>}
      </div>
      <span className="text-2xl font-bold text-heading">{value}</span>
      {trend && (
        <span className={`text-xs font-medium ${trendColour}`}>
          {trendArrow} {trend.label}
        </span>
      )}
    </div>
  );
}
