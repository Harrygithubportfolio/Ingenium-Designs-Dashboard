'use client';

import { useState, useMemo } from 'react';
import mockEvents, { CalendarEvent } from './mock-data';
import EventModal from './EventModal';
import AddEventModal from './AddEventModal';
import EditEventModal from './EditEventModal';
import PlannerView from './PlannerView';
import MonthView from './MonthView';

type CalendarTab = 'planner' | 'month';

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);

  const [tab, setTab] = useState<CalendarTab>('planner');

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [adding, setAdding] = useState(false);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());

  const today = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const currentDateStr = currentDate.toISOString().split('T')[0];

  const dayEvents = useMemo(
    () => events.filter(e => e.date === currentDateStr),
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
    return events.filter(e => {
      const d = new Date(e.date);
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

  const addEvent = (event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
  };

  const updateEvent = (updated: CalendarEvent) => {
    setEvents(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedEvent(null);
    setEditingEvent(null);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* HEADER */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Calendar</h1>
            <p className="text-gray-500 text-[11px]">Your events at a glance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-[#1a1a22] p-1 border border-[#2a2a33]">
            <button
              type="button"
              onClick={() => setTab('planner')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'planner'
                  ? 'bg-[#3b82f6] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Planner
            </button>
            <button
              type="button"
              onClick={() => setTab('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'month'
                  ? 'bg-[#3b82f6] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white hover:from-[#2563eb] hover:to-[#7c3aed] transition-all shadow-lg shadow-[#3b82f6]/20"
          >
            + New
          </button>
        </div>
      </header>

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
          onSave={addEvent}
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
          onSave={updateEvent}
          onDelete={deleteEvent}
        />
      )}
    </div>
  );
}