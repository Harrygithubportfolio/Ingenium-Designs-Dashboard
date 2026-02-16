'use client';

import { type StravaSportType, getSportColor, getSportIcon, getSportLabel } from '@/lib/strava/types';

interface Props {
  sportType: StravaSportType;
  showIcon?: boolean;
}

export default function SportTypeBadge({ sportType, showIcon = true }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSportColor(sportType)}`}>
      {showIcon && <span className="text-[10px]">{getSportIcon(sportType)}</span>}
      {getSportLabel(sportType)}
    </span>
  );
}
