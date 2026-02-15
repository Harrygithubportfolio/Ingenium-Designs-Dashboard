'use client';

import { type ScheduledWorkoutStatus, WORKOUT_STATUS_COLORS } from '@/lib/fitness/types';

interface Props {
  status: ScheduledWorkoutStatus;
}

export default function WorkoutStatusBadge({ status }: Props) {
  const colors = WORKOUT_STATUS_COLORS[status];
  const labels: Record<ScheduledWorkoutStatus, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
    missed: 'Missed',
    rescheduled: 'Rescheduled',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {labels[status]}
    </span>
  );
}
