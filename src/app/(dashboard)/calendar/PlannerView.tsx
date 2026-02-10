'use client';

import { useState } from 'react';
import { CalendarEvent } from './mock-data';
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
      className="w-full rounded-xl border border-[#2a2a33] bg-[#1a1a22] px-3 py-2.5 text-left hover:border-[#3b82f6] hover:bg-[#1e1e28] transition-all group"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white group-hover:text-[#3b82f6] truncate">
          {event.title}
        </p>
        {event.time && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {event.time}
          </span>
        )}
      </div>
      {event.location && (
        <p className="mt-1 text-xs text-gray-500 truncate">
          📍 {event.location}
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
            ? 'bg-[#3b82f6] text-white'
            : 'bg-[#1a1a22] text-gray-400 border border-[#2a2a33] hover:border-[#3b82f6]'
        }`}
      >
        {resizeEnabled ? '✓ Resize Mode' : 'Enable Resize'}
      </button>

      {/* DAY VIEW */}
      <ResizablePanel
        defaultSize={50}
        minSize={30}
        maxSize={70}
        resizable={resizeEnabled}
      >
        <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-4 md:p-5 flex flex-col min-h-0 overflow-hidden hover:border-[#3b82f6]/40 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white">Day View</span>
                <p className="text-xs text-gray-500 truncate">
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
                className="px-2 py-1 text-xs rounded-lg bg-[#1a1a22] border border-[#2a2a33] text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-all"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white hover:from-[#2563eb] hover:to-[#7c3aed] transition-all"
              >
                Today
              </button>
              <button
                type="button"
                onClick={onNextDay}
                className="px-2 py-1 text-xs rounded-lg bg-[#1a1a22] border border-[#2a2a33] text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-all"
              >
                →
              </button>
            </div>
          </div>

          {/* Events */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {dayEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">No events scheduled for this day</p>
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
        <div className="h-full bg-gradient-to-br from-[#1a1a22] to-[#14141a] rounded-2xl border border-[#2a2a33] p-4 md:p-5 flex flex-col gap-3 overflow-hidden hover:border-[#3b82f6]/40 transition-all">
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Week</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onWeekChange(-1)}
                className="px-2 py-1 text-xs rounded-lg bg-[#1a1a22] border border-[#2a2a33] text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-all"
              >
                ←
              </button>
              <span className="text-xs text-gray-400">
                {weekStart.toLocaleDateString('default', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                –{' '}
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
                className="px-2 py-1 text-xs rounded-lg bg-[#1a1a22] border border-[#2a2a33] text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-all"
              >
                →
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-between flex-1 min-h-0">
            {weekDays.map((d, idx) => {
              const dateStr = d.toISOString().split('T')[0];
              const dayHasEvents = weekEvents.some((e) => e.date === dateStr);
              const isTodayFlag = isSameDay(d, today);
              const isSelected = isSameDay(d, currentDate);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentDate(d)}
                  className={`flex-1 flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs transition-all min-w-0 ${
                    isSelected
                      ? 'border-[#3b82f6] bg-[#3b82f6]/10 scale-105'
                      : isTodayFlag
                      ? 'border-[#3b82f6]/50 bg-[#1a1a22]'
                      : 'border-[#2a2a33] bg-[#1a1a22] hover:border-[#3b82f6]/50'
                  }`}
                >
                  <span className={`text-[0.65rem] ${isSelected ? 'text-[#3b82f6]' : 'text-gray-500'}`}>
                    {d.toLocaleDateString('default', { weekday: 'short' })}
                  </span>
                  <span className={`mt-1 text-sm font-semibold ${isSelected ? 'text-[#3b82f6]' : 'text-white'}`}>
                    {d.getDate()}
                  </span>
                  {isTodayFlag && !isSelected && (
                    <span className="mt-1 text-[0.6rem] text-[#3b82f6]">Today</span>
                  )}
                  {dayHasEvents && (
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-[#3b82f6]' : 'bg-emerald-500'}`} />
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
