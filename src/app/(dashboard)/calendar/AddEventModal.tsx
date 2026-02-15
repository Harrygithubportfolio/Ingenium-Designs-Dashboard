'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCalendar } from '@/store/useCalendar';

interface Props {
  onClose: () => void;
  onSave: () => void;
}

export default function AddEventModal({ onClose, onSave }: Props) {
  const { addEvent, connection } = useCalendar();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title || !date) return;
    setSaving(true);
    await addEvent({
      title,
      event_date: date,
      start_time: isAllDay ? undefined : startTime || undefined,
      end_time: isAllDay ? undefined : endTime || undefined,
      location: location || undefined,
      description: description || undefined,
      is_all_day: isAllDay,
      sync_to_google: syncToGoogle,
    });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#1f1f27] border border-[#2a2a33] p-6 rounded-xl w-full max-w-md shadow-xl"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Add Event</h2>

        <div className="space-y-3">
          <input
            className="w-full p-2 rounded bg-[#2a2a33] text-white"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <input
            type="date"
            className="w-full p-2 rounded bg-[#2a2a33] text-white"
            aria-label="Event date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={e => setIsAllDay(e.target.checked)}
              className="rounded bg-[#2a2a33] border-[#3a3a44]"
            />
            All day
          </label>

          {!isAllDay && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Start</label>
                <input
                  type="time"
                  className="w-full p-2 rounded bg-[#2a2a33] text-white"
                  aria-label="Start time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">End</label>
                <input
                  type="time"
                  className="w-full p-2 rounded bg-[#2a2a33] text-white"
                  aria-label="End time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <input
            className="w-full p-2 rounded bg-[#2a2a33] text-white"
            placeholder="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />

          <textarea
            className="w-full p-2 rounded bg-[#2a2a33] text-white"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          {connection && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToGoogle}
                onChange={e => setSyncToGoogle(e.target.checked)}
                className="rounded bg-[#2a2a33] border-[#3a3a44]"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Sync to Google Calendar
              </span>
            </label>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving || !title || !date}
          className="mt-6 w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Event'}
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 bg-[#2a2a33] rounded-lg hover:bg-[#3a3a44] transition"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
