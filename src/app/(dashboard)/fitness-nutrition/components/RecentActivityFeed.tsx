import type { GymSession } from '@/lib/fitness/types';
import { TRAINING_INTENT_COLORS } from '@/lib/fitness/types';
import type { TrainingIntent } from '@/lib/fitness/types';

interface RecentActivityFeedProps {
  sessions: GymSession[];
}

export default function RecentActivityFeed({ sessions }: RecentActivityFeedProps) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4">
      <h3 className="text-sm font-semibold text-heading mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {sessions.map((session) => {
          const template = session.template as { name?: string; training_intent?: TrainingIntent } | undefined;
          const name = template?.name ?? 'Free Session';
          const intent = template?.training_intent;
          const intentColors = intent ? TRAINING_INTENT_COLORS[intent] : '';
          const date = new Date(session.started_at);
          const volume = session.total_volume_kg ? `${Math.round(Number(session.total_volume_kg)).toLocaleString()} kg` : '';
          const duration = session.total_duration_sec
            ? `${Math.floor(session.total_duration_sec / 60)} min`
            : '';

          return (
            <div key={session.id} className="flex items-center gap-3 py-2 px-3 bg-inner rounded-lg">
              {intent && (
                <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${intentColors.split(' ')[1] ?? 'bg-accent/10'}`} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sub truncate">{name}</p>
                <p className="text-[10px] text-dim">
                  {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {volume && <p className="text-xs text-heading font-medium">{volume}</p>}
                {duration && <p className="text-[10px] text-dim">{duration}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
