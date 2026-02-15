'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCalendar } from '@/store/useCalendar';
import type { CalendarEvent } from '@/lib/calendar/types';

interface Props {
  event: CalendarEvent;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function EditEventModal({ event, onClose, onSave, onDelete }: Props) {
  const { updateEvent, deleteEvent } = useCalendar();
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.event_date);
  const [startTime, setStartTime] = useState(event.start_time?.slice(0, 5) || '');
  const [endTime, setEndTime] = useState(event.end_time?.slice(0, 5) || '');
  const [location, setLocation] = useState(event.location || '');
  const [description, setDescription] = useState(event.description || '');
  const [isAllDay, setIsAllDay] = useState(event.is_all_day);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateEvent(event.id, {
      title,
      event_date: date,
      start_time: isAllDay ? undefined : startTime || undefined,
      end_time: isAllDay ? undefined : endTime || undefined,
      location: location || undefined,
      description: description || undefined,
      is_all_day: isAllDay,
    });
    setSaving(false);
    onSave();
  };

  const handleDelete = async () => {
    await deleteEvent(event.id);
    onDelete();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-elevated border border-edge p-6 rounded-xl w-full max-w-md shadow-xl"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-heading">Edit Event</h2>
          {event.source === 'google' && (
            <span className="px-2 py-0.5 text-[0.65rem] font-medium rounded-full bg-emerald-500/20 text-emerald-400">
              Google
            </span>
          )}
        </div>

        {event.source === 'google' && (
          <p className="text-xs text-emerald-400/80 mb-3">
            Changes will sync back to Google Calendar.
          </p>
        )}

        <div className="space-y-3">
          <input
            className="w-full p-2 rounded bg-edge text-heading"
            aria-label="Event title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <input
            type="date"
            className="w-full p-2 rounded bg-edge text-heading"
            aria-label="Event date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm text-sub cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={e => setIsAllDay(e.target.checked)}
              className="rounded bg-edge border-edge"
            />
            All day
          </label>

          {!isAllDay && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-sub mb-1 block">Start</label>
                <input
                  type="time"
                  className="w-full p-2 rounded bg-edge text-heading"
                  aria-label="Start time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-sub mb-1 block">End</label>
                <input
                  type="time"
                  className="w-full p-2 rounded bg-edge text-heading"
                  aria-label="End time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <input
            className="w-full p-2 rounded bg-edge text-heading"
            aria-label="Event location"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />

          <textarea
            className="w-full p-2 rounded bg-edge text-heading"
            aria-label="Event description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-6 w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          onClick={handleDelete}
          className="mt-2 w-full py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
        >
          Delete Event
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 bg-edge rounded-lg hover:bg-edge transition"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
