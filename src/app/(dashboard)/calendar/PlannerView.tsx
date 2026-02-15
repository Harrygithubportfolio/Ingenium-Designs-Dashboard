'use client';

import { useState } from 'react';
import type { CalendarEvent } from '@/lib/calendar/types';
import ResizablePanel from '@/components/ResizablePanel';

type PlannerViewProps = {
  today: Date;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
  dayEvents: CalendarEvent[];
  weekStart: Date;
  weekDays: Date[];
  weekEvents: CalendarEvent[];
  isSameDay: (a: Date, b: Date) => boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onWeekChange: (dir: -1 | 1) => void;
  onSelectEvent: (e: CalendarEvent) => void;
};

export default function PlannerView({
  today,
  currentDate,
  setCurrentDate,
  dayEvents,
  weekStart,
  weekDays,
  weekEvents,
  isSameDay,
  onPrevDay,
  onNextDay,
  onWeekChange,
  onSelectEvent,
}: PlannerViewProps) {
  const [resizeEnabled, setResizeEnabled] = useState(false);

  const renderDayEventPill = (event: CalendarEvent) => (
    <button
      key={event.id}
      type="button"
      onClick={() => onSelectEvent(event)}
      className={`w-full rounded-xl border px-3 py-2.5 text-left hover:border-accent hover:bg-elevated transition-all group ${
        event.source === 'google'
          ? 'border-l-[3px] border-l-emerald-500 border-y-edge border-r-edge bg-card'
          : 'border-edge bg-card'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {event.source === 'google' && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </span>
          )}
          <p className="text-sm font-medium text-heading group-hover:text-accent truncate">
            {event.title}
          </p>
        </div>
        {event.start_time && (
          <span className="text-xs text-sub flex-shrink-0">
            {event.start_time.slice(0, 5)}
            {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
          </span>
        )}
      </div>
      {event.location && (
        <p className="mt-1 text-xs text-dim truncate">
          {event.location}
        </p>
      )}
    </button>
  );

  return (
    <div className="h-full flex flex-col gap-4 min-h-0 overflow-hidden relative">
      {/* Resize Toggle Button */}
      <button
        type="button"
        onClick={() => setResizeEnabled(!resizeEnabled)}
        className={`absolute top-0 right-0 z-20 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shadow-lg ${
          resizeEnabled
            ? 'bg-accent text-white'
            : 'bg-card text-sub border border-edge hover:border-accent'
        }`}
      >
        {resizeEnabled ? 'Resize Mode' : 'Enable Resize'}
      </button>

      {/* DAY VIEW */}
      <ResizablePanel
        defaultSize={50}
        minSize={30}
        maxSize={70}
        resizable={resizeEnabled}
      >
        <div className="h-full bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4 md:p-5 flex flex-col min-h-0 overflow-hidden hover:border-accent/40 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
                <svg className="w-4 h-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-heading">Day View</span>
                <p className="text-xs text-dim truncate">
                  {currentDate.toLocaleDateString('default', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onPrevDay}
                className="px-2 py-1 text-xs rounded-lg bg-card border border-edge text-sub hover:text-accent hover:border-accent transition-all"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white hover:from-accent-hover hover:to-accent-secondary transition-all"
              >
                Today
              </button>
              <button
                type="button"
                onClick={onNextDay}
                className="px-2 py-1 text-xs rounded-lg bg-card border border-edge text-sub hover:text-accent hover:border-accent transition-all"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Events */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {dayEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-dim">No events scheduled for this day</p>
              </div>
            ) : (
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {dayEvents.map(renderDayEventPill)}
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      {/* WEEK STRIP */}
      <div className="flex-1 min-h-0">
        <div className="h-full bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4 md:p-5 flex flex-col gap-3 overflow-hidden hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-heading">Week</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onWeekChange(-1)}
                className="px-2 py-1 text-xs rounded-lg bg-card border border-edge text-sub hover:text-accent hover:border-accent transition-all"
              >
                &larr;
              </button>
              <span className="text-xs text-sub">
                {weekStart.toLocaleDateString('default', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                &ndash;{' '}
                {new Date(
                  weekStart.getFullYear(),
                  weekStart.getMonth(),
                  weekStart.getDate() + 6
                ).toLocaleDateString('default', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <button
                type="button"
                onClick={() => onWeekChange(1)}
                className="px-2 py-1 text-xs rounded-lg bg-card border border-edge text-sub hover:text-accent hover:border-accent transition-all"
              >
                &rarr;
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-between flex-1 min-h-0">
            {weekDays.map((d, idx) => {
              const dateStr = d.toISOString().split('T')[0];
              const dayHasEvents = weekEvents.some((e) => e.event_date === dateStr);
              const hasGoogleEvent = weekEvents.some((e) => e.event_date === dateStr && e.source === 'google');
              const isTodayFlag = isSameDay(d, today);
              const isSelected = isSameDay(d, currentDate);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentDate(d)}
                  className={`flex-1 flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs transition-all min-w-0 ${
                    isSelected
                      ? 'border-accent bg-accent/10 scale-105'
                      : isTodayFlag
                      ? 'border-accent/50 bg-card'
                      : 'border-edge bg-card hover:border-accent/50'
                  }`}
                >
                  <span className={`text-[0.65rem] ${isSelected ? 'text-accent' : 'text-dim'}`}>
                    {d.toLocaleDateString('default', { weekday: 'short' })}
                  </span>
                  <span className={`mt-1 text-sm font-semibold ${isSelected ? 'text-accent' : 'text-heading'}`}>
                    {d.getDate()}
                  </span>
                  {isTodayFlag && !isSelected && (
                    <span className="mt-1 text-[0.6rem] text-accent">Today</span>
                  )}
                  {dayHasEvents && (
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      hasGoogleEvent ? 'bg-emerald-500' : isSelected ? 'bg-accent' : 'bg-emerald-500'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
