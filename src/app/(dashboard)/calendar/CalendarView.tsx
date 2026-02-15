'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCalendar } from '@/store/useCalendar';
import type { CalendarEvent } from '@/lib/calendar/types';
import EventModal from './EventModal';
import AddEventModal from './AddEventModal';
import EditEventModal from './EditEventModal';
import PlannerView from './PlannerView';
import MonthView from './MonthView';
import GoogleCalendarBanner from './GoogleCalendarBanner';

type CalendarTab = 'planner' | 'month';

export default function CalendarView() {
  const { events, loading, fetchEvents, fetchConnection } = useCalendar();

  const [tab, setTab] = useState<CalendarTab>('planner');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [adding, setAdding] = useState(false);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());

  const today = new Date();

  // Fetch connection status on mount
  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  // Compute the date range to fetch based on current view
  const dateRange = useMemo(() => {
    if (tab === 'month') {
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      };
    }
    // Planner view: fetch current week + buffer
    const d = new Date(currentDate);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
    const from = new Date(d);
    from.setDate(from.getDate() - 7); // week before
    const to = new Date(d);
    to.setDate(to.getDate() + 14); // two weeks after
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }, [tab, month, year, currentDate]);

  // Fetch events whenever date range changes
  useEffect(() => {
    fetchEvents(dateRange.from, dateRange.to);
  }, [dateRange.from, dateRange.to, fetchEvents]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const currentDateStr = currentDate.toISOString().split('T')[0];

  const dayEvents = useMemo(
    () => events.filter((e) => e.event_date === currentDateStr),
    [events, currentDateStr]
  );

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const weekEvents = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return events.filter((e) => {
      const d = new Date(e.event_date);
      return d >= start && d < end;
    });
  }, [events, weekStart]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };

  const handleWeekChange = (direction: -1 | 1) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };

  const handleMonthChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
    const d = new Date(newYear, newMonth, 1);
    setCurrentDate(d);
  };

  const handleEventAdded = () => {
    // Re-fetch events after adding
    fetchEvents(dateRange.from, dateRange.to);
  };

  const handleEventUpdated = () => {
    fetchEvents(dateRange.from, dateRange.to);
    setEditingEvent(null);
  };

  const handleEventDeleted = () => {
    fetchEvents(dateRange.from, dateRange.to);
    setSelectedEvent(null);
    setEditingEvent(null);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* HEADER */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Calendar</h1>
            <p className="text-dim text-[11px]">Your events at a glance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-card p-1 border border-edge">
            <button
              type="button"
              onClick={() => setTab('planner')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'planner'
                  ? 'bg-accent text-white'
                  : 'text-sub hover:text-heading'
              }`}
            >
              Planner
            </button>
            <button
              type="button"
              onClick={() => setTab('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'month'
                  ? 'bg-accent text-white'
                  : 'text-sub hover:text-heading'
              }`}
            >
              Month
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white hover:from-accent-hover hover:to-accent-secondary transition-all shadow-lg shadow-accent/20"
          >
            + New
          </button>
        </div>
      </header>

      {/* GOOGLE CALENDAR BANNER */}
      <GoogleCalendarBanner />

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-edge">
          <div className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs text-sub">Loading events...</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-0 flex flex-col">
        {tab === 'planner' && (
          <PlannerView
            today={today}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            month={month}
            year={year}
            setMonth={setMonth}
            setYear={setYear}
            dayEvents={dayEvents}
            weekStart={weekStart}
            weekDays={weekDays}
            weekEvents={weekEvents}
            isSameDay={isSameDay}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            onWeekChange={handleWeekChange}
            onSelectEvent={setSelectedEvent}
          />
        )}

        {tab === 'month' && (
          <MonthView
            today={today}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            month={month}
            year={year}
            daysInMonth={daysInMonth}
            events={events}
            isSameDay={isSameDay}
            onMonthChange={handleMonthChange}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </main>

      {/* MODALS */}
      {adding && (
        <AddEventModal
          onClose={() => setAdding(false)}
          onSave={handleEventAdded}
        />
      )}

      {selectedEvent && !editingEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setEditingEvent(selectedEvent);
            setSelectedEvent(null);
          }}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleEventUpdated}
          onDelete={handleEventDeleted}
        />
      )}
    </div>
  );
}
