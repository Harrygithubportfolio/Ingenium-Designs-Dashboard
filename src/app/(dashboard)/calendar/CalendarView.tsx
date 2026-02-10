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
    <div className="h-screen w-full overflow-hidden bg-[#151411] flex flex-col">
      {/* HEADER */}
      <header className="px-6 pt-5 pb-3 border-b border-[#2a2924] bg-[#1b1a17]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#b0a89a]">
              Paper Planner · Life OS
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-[#f5f1e8]">
              Calendar
            </h1>
            <p className="mt-1 text-xs text-[#c4bba9]">
              A warm, journal‑style view of your time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full bg-[#25231f] p-1 border border-[#343129]">
              <button
                onClick={() => setTab('planner')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  tab === 'planner'
                    ? 'bg-[#f0e3c2] text-[#2a261f]'
                    : 'text-[#c4bba9]'
                }`}
              >
                Planner
              </button>
              <button
                onClick={() => setTab('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  tab === 'month'
                    ? 'bg-[#f0e3c2] text-[#2a261f]'
                    : 'text-[#c4bba9]'
                }`}
              >
                Month
              </button>
            </div>

            <button
              onClick={() => setAdding(true)}
              className="px-4 py-2 text-xs md:text-sm font-medium rounded-full bg-[#e0b15a] text-[#2a261f] hover:bg-[#f0c56f] transition-colors shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            >
              + New Entry
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-6 pb-4 pt-3 flex flex-col text-[#f5f1e8]">
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