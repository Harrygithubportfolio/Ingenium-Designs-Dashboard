'use client';

import { CalendarEvent } from './mock-data';

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
  const renderDayEventPill = (event: CalendarEvent) => (
    <button
      key={event.id}
      type="button"
      onClick={() => onSelectEvent(event)}
      className="w-full rounded-xl border border-[#3a352c] bg-[#26241f] px-3 py-2.5 text-left hover:border-[#e0b15a] transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#f5e7cf]">
          {event.title}
        </p>
        {event.time && (
          <span className="text-xs text-[#d1c7b4]">
            {event.time}
          </span>
        )}
      </div>
      {event.location && (
        <p className="mt-1 text-xs text-[#a79f90]">
          {event.location}
        </p>
      )}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
      {/* DAY VIEW (takes ~1/2 of remaining height) */}
      <section className="flex-[1] rounded-2xl bg-[#23221f] border border-[#343129] p-4 md:p-5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-[#b0a89a]">
              Day View
            </p>
            <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#f5f1e8] truncate">
              {currentDate.toLocaleDateString('default', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onPrevDay}
              className="px-2 py-1 text-xs rounded-full bg-[#2b2822] text-[#d1c7b4] hover:bg-[#343129]"
            >
              ←
            </button>
            <button
              onClick={() => {
                const d = new Date();
                setCurrentDate(d);
              }}
              className="px-3 py-1 text-xs rounded-full bg-[#f0e3c2] text-[#2a261f] hover:bg-[#f5e7cf]"
            >
              Today
            </button>
            <button
              onClick={onNextDay}
              className="px-2 py-1 text-xs rounded-full bg-[#2b2822] text-[#d1c7b4] hover:bg-[#343129]"
            >
              →
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#3b362b] to-transparent mb-3 flex-shrink-0" />

        <div className="flex-1 min-h-0 overflow-y-auto">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-[#a79f90] italic">
              No entries for this day yet.
            </p>
          ) : (
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {dayEvents.map(renderDayEventPill)}
            </div>
          )}
        </div>
      </section>

      {/* WEEK STRIP (takes ~1/3) */}
      <section className="flex-[1] min-h-0 overflow-hidden">
        <div className="h-full rounded-2xl bg-[#23221f] border border-[#343129] p-3 md:p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0">
            <p className="text-xs uppercase tracking-[0.18em] text-[#b0a89a]">
              Week
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onWeekChange(-1)}
                className="px-2 py-1 text-xs rounded-full bg-[#2b2822] text-[#d1c7b4] hover:bg-[#343129]"
              >
                ←
              </button>
              <span className="text-xs text-[#c4bba9]">
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
                onClick={() => onWeekChange(1)}
                className="px-2 py-1 text-xs rounded-full bg-[#2b2822] text-[#d1c7b4] hover:bg-[#343129]"
              >
                →
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-between flex-1 min-h-0">
            {weekDays.map((d, idx) => {
              const dateStr = d.toISOString().split('T')[0];
              const dayHasEvents = weekEvents.some(e => e.date === dateStr);
              const isTodayFlag = isSameDay(d, today);
              const isSelected = isSameDay(d, currentDate);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentDate(d)}
                  className={`flex-1 flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'border-[#e0b15a] bg-[#2b2822]'
                      : 'border-[#343129] bg-[#25231f]'
                  }`}
                >
                  <span className="text-[0.65rem] text-[#b0a89a]">
                    {d.toLocaleDateString('default', { weekday: 'short' })}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-[#f5e7cf]">
                    {d.getDate()}
                  </span>
                  {isTodayFlag && (
                    <span className="mt-1 text-[0.6rem] text-[#e0b15a]">
                      Today
                    </span>
                  )}
                  {dayHasEvents && (
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#e0b15a]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}