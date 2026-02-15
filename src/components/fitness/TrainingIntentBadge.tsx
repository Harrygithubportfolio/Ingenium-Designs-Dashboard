'use client';

import { type TrainingIntent, TRAINING_INTENT_LABELS, TRAINING_INTENT_COLORS } from '@/lib/fitness/types';

interface Props {
  intent: TrainingIntent;
}

export default function TrainingIntentBadge({ intent }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TRAINING_INTENT_COLORS[intent]}`}>
      {TRAINING_INTENT_LABELS[intent]}
    </span>
  );
}
