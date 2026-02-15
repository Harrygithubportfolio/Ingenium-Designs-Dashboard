'use client';

interface Props {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  size?: number;
}

export default function MacroPieChart({ protein_g, carbs_g, fat_g, size = 120 }: Props) {
  const total = protein_g + carbs_g + fat_g;
  if (total === 0) {
    return (
      <div
        className="rounded-full bg-elevated flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-dim">No data</span>
      </div>
    );
  }

  const proteinPct = (protein_g / total) * 100;
  const carbsPct = (carbs_g / total) * 100;
  // fatPct fills the rest

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  // Protein starts at 0
  const proteinDash = (proteinPct / 100) * circumference;
  // Carbs starts after protein
  const carbsDash = (carbsPct / 100) * circumference;
  // Fat fills the rest
  const fatDash = circumference - proteinDash - carbsDash;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth={12} style={{ stroke: 'var(--bg-elevated)' }} />
        {/* Protein */}
        <circle
          cx="50" cy="50" r={radius} fill="none"
          strokeWidth={12}
          style={{ stroke: 'var(--accent)' }}
          strokeDasharray={`${proteinDash} ${circumference - proteinDash}`}
          strokeDashoffset={0}
        />
        {/* Carbs */}
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="#f59e0b"
          strokeWidth={12}
          strokeDasharray={`${carbsDash} ${circumference - carbsDash}`}
          strokeDashoffset={-proteinDash}
        />
        {/* Fat */}
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="#ef4444"
          strokeWidth={12}
          strokeDasharray={`${fatDash} ${circumference - fatDash}`}
          strokeDashoffset={-(proteinDash + carbsDash)}
        />
      </svg>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-sub">P: {Math.round(protein_g)}g</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-sub">C: {Math.round(carbs_g)}g</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
          <span className="text-sub">F: {Math.round(fat_g)}g</span>
        </span>
      </div>
    </div>
  );
}
