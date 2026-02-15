'use client';

import type { IntakeEvent } from '@/lib/nutrition/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, getEffectiveValue } from '@/lib/nutrition/types';

interface Props {
  event: IntakeEvent;
  onEdit?: (event: IntakeEvent) => void;
}

export default function IntakeEventCard({ event, onEdit }: Props) {
  const items = event.items ?? [];
  let totalCal = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;

  for (const item of items) {
    totalCal += getEffectiveValue(item.estimated_calories, item.edited_calories);
    totalP += getEffectiveValue(item.estimated_protein_g, item.edited_protein_g);
    totalC += getEffectiveValue(item.estimated_carbs_g, item.edited_carbs_g);
    totalF += getEffectiveValue(item.estimated_fat_g, item.edited_fat_g);
  }

  const time = new Date(event.event_timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onEdit?.(event)}
      className="flex items-center gap-3 p-3 bg-[#14141a] rounded-xl hover:bg-[#1a1a22] transition-colors cursor-pointer"
    >
      <span className="text-lg flex-shrink-0">{MEAL_TYPE_ICONS[event.meal_type]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {MEAL_TYPE_LABELS[event.meal_type]}
          </span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-xs text-gray-400 truncate">
          {items.map((i) => i.food_name).join(', ')}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white">{Math.round(totalCal)} cal</p>
        <p className="text-[10px] text-gray-500">
          P:{Math.round(totalP)}g C:{Math.round(totalC)}g F:{Math.round(totalF)}g
        </p>
      </div>
    </div>
  );
}
