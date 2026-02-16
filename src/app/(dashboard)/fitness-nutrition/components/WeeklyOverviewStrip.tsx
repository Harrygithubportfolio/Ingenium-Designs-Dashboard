import type { ScheduledWorkout } from '@/lib/fitness/types';

interface WeeklyOverviewStripProps {
  weekSchedule: ScheduledWorkout[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyOverviewStrip({ weekSchedule }: WeeklyOverviewStripProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Build a map of date -> workout
  const workoutByDate = new Map<string, ScheduledWorkout>();
  for (const w of weekSchedule) {
    workoutByDate.set(w.scheduled_date, w);
  }

  // Get Monday of this week
  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const workout = workoutByDate.get(dateStr);
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

    return { dateStr, dayName: DAYS[i], dayNum: date.getDate(), workout, isToday, isPast };
  });

  return (
    <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4">
      <h2 className="text-sm font-semibold text-heading mb-3">This Week</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map(({ dateStr, dayName, dayNum, workout, isToday, isPast }) => {
          let dotColor = 'bg-inner'; // rest day
          if (workout) {
            if (workout.status === 'completed') dotColor = 'bg-green-400';
            else if (workout.status === 'scheduled') dotColor = isPast ? 'bg-red-400' : 'bg-blue-400';
            else if (workout.status === 'rescheduled') dotColor = 'bg-amber-400';
          }

          return (
            <div
              key={dateStr}
              className={`flex flex-col items-center gap-1.5 py-2 rounded-xl transition-colors ${
                isToday ? 'bg-accent/10 border border-accent/30' : ''
              }`}
            >
              <span className={`text-[10px] font-medium ${isToday ? 'text-accent' : 'text-dim'}`}>
                {dayName}
              </span>
              <span className={`text-xs font-semibold ${isToday ? 'text-accent' : 'text-sub'}`}>
                {dayNum}
              </span>
              <div className={`w-2 h-2 rounded-full ${dotColor}`} />
              {workout && (
                <span className="text-[8px] text-dim truncate max-w-full px-1">
                  {workout.template?.name?.split(' ')[0] ?? ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[9px] text-dim">Done</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[9px] text-dim">Upcoming</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-inner" />
          <span className="text-[9px] text-dim">Rest</span>
        </div>
      </div>
    </div>
  );
}
