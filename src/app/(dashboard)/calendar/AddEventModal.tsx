'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from './mock-data';

interface Props {
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
}

export default function AddEventModal({ onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const save = () => {
    if (!title || !date) return;
    onSave({
      id: Date.now(),
      title,
      date,
      time,
      location,
      description,
    });
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

          <input
            type="time"
            className="w-full p-2 rounded bg-[#2a2a33] text-white"
            aria-label="Event time"
            value={time}
            onChange={e => setTime(e.target.value)}
          />

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
        </div>

        <button
          onClick={save}
          className="mt-6 w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Save Event
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