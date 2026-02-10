'use client';

import { motion } from 'framer-motion';
import { CalendarEvent } from './mock-data';

interface Props {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
}

export default function EventModal({ event, onClose, onEdit }: Props) {
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
        <h2 className="text-2xl font-bold text-white mb-4">{event.title}</h2>

        <div className="space-y-2 text-gray-300">
          <p><strong>Date:</strong> {event.date}</p>
          {event.time && <p><strong>Time:</strong> {event.time}</p>}
          {event.location && <p><strong>Location:</strong> {event.location}</p>}
          {event.description && <p><strong>Details:</strong> {event.description}</p>}
        </div>

        <button
          onClick={onEdit}
          className="mt-6 w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Edit Event
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 bg-[#2a2a33] rounded-lg hover:bg-[#3a3a44] transition"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}