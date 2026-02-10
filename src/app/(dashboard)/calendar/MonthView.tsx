'use client';

import { CalendarEvent } from './mock-data';
import MonthSelector from './MonthSelector';

type MonthViewProps = {
  today: Date;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  month: number;
  year: number;
  daysInMonth: number;
  events: CalendarEvent[];
  isSameDay: (a: Date, b: Date) => boolean;
  onMonthChange: (m: number, y: number) => void;
  onSelectEvent: (e: CalendarEvent) => void;
};

export default function MonthView({
  today,
  currentDate,
  setCurrentDate,
  month,
  year,
  daysInMonth,
  events,
  isSameDay,
  onMonthChange,
  onSelectEvent,
}: MonthViewProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      <section className="flex-1 rounded-2xl bg-[#23221f] border border-[#343129] p-4 md:p-5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#b0a89a]">
              Monthly Spread
            </p>
            <p className="mt-1 text-xs text-[#c4bba9]">
              A bird’s‑eye view, like a planner spread.
            </p>
          </div>

          <MonthSelector
            month={month}
            year={year}
            onChange={onMonthChange}
          />
        </div>

        <div className="grid grid-rows-[auto,1fr] gap-2 flex-1 min-h-0">
          <div className="grid grid-cols-7 gap-2 text-[0.7rem] font-medium text-[#b0a89a] tracking-[0.18em] uppercase">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 min-h-0">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(year, month, i + 1);
              const dateStr = date.toISOString().split('T')[0];
              const dayEventsForDate = events.filter(e => e.date === dateStr);
              const isTodayFlag = isSameDay(date, today);
              const isSelected = isSameDay(date, currentDate);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrentDate(date);
                    if (dayEventsForDate[0]) {
                      onSelectEvent(dayEventsForDate[0]);
                    }
                  }}
                  className={`relative flex flex-col items-start rounded-xl border px-2 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-[#e0b15a] bg-[#2b2822]'
                      : 'border-[#343129] bg-[#25231f]'
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isTodayFlag
                        ? 'bg-[#e0b15a] text-[#2a261f]'
                        : 'bg-[#2f2b24] text-[#e3d7c2]'
                    }`}
                  >
                    {i + 1}
                  </span>

                  <div className="mt-1 space-y-1 w-full">
                    {dayEventsForDate.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className="w-full rounded-full bg-[#3a352c] px-2 py-0.5 text-[0.7rem] text-[#f5e7cf] truncate"
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEventsForDate.length > 2 && (
                      <p className="text-[0.65rem] text-[#b0a89a]">
                        +{dayEventsForDate.length - 2} more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}