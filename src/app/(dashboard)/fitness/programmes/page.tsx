'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { TrainingProgramme } from '@/lib/fitness/programme-types';
import {
  PROGRAMME_GOAL_LABELS,
  PROGRAMME_GOAL_COLORS,
  PROGRAMME_STATUS_LABELS,
  PROGRAMME_STATUS_COLORS,
} from '@/lib/fitness/programme-types';

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<TrainingProgramme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fitness/programmes')
      .then((r) => r.json())
      .then((json) => {
        setProgrammes(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/fitness-nutrition" className="text-dim hover:text-sub transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">My Programmes</h1>
            <p className="text-dim text-[11px]">AI-generated training plans</p>
          </div>
        </div>
        <Link
          href="/fitness/generate"
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Generate New
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : programmes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-heading">No programmes yet</h2>
            <p className="text-xs text-dim text-center max-w-xs">
              Let AI design a bespoke training plan tailored to your goals, experience, and schedule.
            </p>
            <Link
              href="/fitness/generate"
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 transition-opacity"
            >
              Generate Your First Programme
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {programmes.map((prog) => (
              <ProgrammeCard key={prog.id} programme={prog} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgrammeCard({ programme }: { programme: TrainingProgramme }) {
  const goalColors = PROGRAMME_GOAL_COLORS[programme.goal] ?? 'text-blue-400 bg-blue-400/10';
  const statusColors = PROGRAMME_STATUS_COLORS[programme.status] ?? 'text-blue-400 bg-blue-400/10';

  return (
    <Link
      href={`/fitness/programmes/${programme.id}`}
      className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 hover:border-accent/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-heading group-hover:text-accent transition-colors">
          {programme.name}
        </h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors}`}>
          {PROGRAMME_STATUS_LABELS[programme.status]}
        </span>
      </div>

      {programme.description && (
        <p className="text-xs text-dim mb-3 line-clamp-2">{programme.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${goalColors}`}>
          {PROGRAMME_GOAL_LABELS[programme.goal]}
        </span>
        <span className="text-[10px] text-dim">
          {programme.duration_weeks} weeks
        </span>
        <span className="text-[10px] text-dim">
          {programme.days_per_week} days/week
        </span>
      </div>

      <p className="text-[10px] text-dim mt-3">
        Created {new Date(programme.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </Link>
  );
}
