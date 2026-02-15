'use client';

import { getConfidenceStars } from '@/lib/nutrition/types';

interface Props {
  score: number | null;
}

export default function ConfidenceBadge({ score }: Props) {
  const stars = getConfidenceStars(score);
  const pct = score !== null ? Math.round(score * 100) : 0;

  return (
    <span className="inline-flex items-center gap-1 text-xs" title={`${pct}% confidence`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < stars ? 'text-amber-400' : 'text-dim'}
        >
          ★
        </span>
      ))}
    </span>
  );
}
