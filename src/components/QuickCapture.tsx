'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInbox } from '@/store/useInbox';
import type { InboxItemType } from '@/lib/inbox/types';

const ITEM_TYPES: { key: InboxItemType; label: string; icon: string }[] = [
  { key: 'thought', label: 'Thought', icon: '💭' },
  { key: 'task', label: 'Task', icon: '✓' },
  { key: 'idea', label: 'Idea', icon: '💡' },
  { key: 'link', label: 'Link', icon: '🔗' },
];

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [itemType, setItemType] = useState<InboxItemType>('thought');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addItem, unprocessedCount, fetchItems } = useInbox();

  // Fetch count on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await addItem({ content: content.trim(), item_type: itemType });
    setContent('');
    setItemType('thought');
    setSubmitting(false);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white shadow-lg shadow-accent/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        title="Quick Capture (Ctrl+K)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {unprocessedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unprocessedCount > 9 ? '9+' : unprocessedCount}
          </span>
        )}
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
            >
              <div className="bg-card border border-edge rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
                  <h3 className="text-sm font-semibold text-heading">Quick Capture</h3>
                  <div className="flex items-center gap-2">
                    <kbd className="text-[10px] text-dim bg-elevated px-1.5 py-0.5 rounded">Ctrl+K</kbd>
                    <button type="button" onClick={() => setOpen(false)} className="text-dim hover:text-heading transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Type selector */}
                  <div className="flex gap-2">
                    {ITEM_TYPES.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setItemType(t.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          itemType === t.key
                            ? 'bg-accent text-white'
                            : 'bg-elevated text-sub hover:text-heading'
                        }`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Content input */}
                  <textarea
                    ref={inputRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind?"
                    rows={3}
                    className="w-full bg-inner border border-edge rounded-xl px-4 py-3 text-sm text-heading placeholder-dim resize-none focus:outline-none focus:border-accent/50 transition-colors"
                  />

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-dim">Ctrl+Enter to save</span>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!content.trim() || submitting}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      {submitting ? 'Saving...' : 'Capture'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
