'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useInbox } from '@/store/useInbox';
import type { InboxItem, InboxRouteTarget } from '@/lib/inbox/types';

const TYPE_ICONS: Record<string, string> = {
  thought: '💭',
  task: '✓',
  idea: '💡',
  link: '🔗',
};

const ROUTE_OPTIONS: { key: InboxRouteTarget; label: string }[] = [
  { key: 'goal', label: 'Route to Goal' },
  { key: 'calendar', label: 'Add to Calendar' },
  { key: 'archived', label: 'Archive' },
];

export default function InboxPage() {
  const { items, loading, fetchItems, processItem, deleteItem } = useInbox();
  const [filter, setFilter] = useState<'all' | 'unprocessed' | 'processed'>('unprocessed');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter((item) => {
    if (filter === 'unprocessed') return !item.is_processed;
    if (filter === 'processed') return item.is_processed;
    return true;
  });

  const handleRoute = async (item: InboxItem, target: InboxRouteTarget) => {
    await processItem(item.id, target);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Inbox</h1>
            <p className="text-dim text-[11px]">Process your captured thoughts</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5">
          {(['unprocessed', 'all', 'processed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-elevated text-sub hover:text-heading'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Items list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-sub">
              {filter === 'unprocessed' ? 'Inbox zero! Nothing to process.' : 'No items yet.'}
            </p>
            <p className="text-xs text-dim mt-1">Press <kbd className="bg-elevated px-1.5 py-0.5 rounded text-[10px]">Ctrl+K</kbd> to capture something</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-gradient-to-br from-card to-inner rounded-xl border border-edge p-4 transition-all hover:border-accent/30 ${
                item.is_processed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <span className="text-lg mt-0.5 flex-shrink-0">{TYPE_ICONS[item.item_type] || '📝'}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-heading whitespace-pre-wrap break-words">{item.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-dim">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] text-dim capitalize bg-elevated px-1.5 py-0.5 rounded">
                      {item.item_type}
                    </span>
                    {item.is_processed && item.routed_to && (
                      <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded capitalize">
                        → {item.routed_to}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!item.is_processed && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {ROUTE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleRoute(item, opt.key)}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium bg-elevated text-sub hover:text-heading hover:bg-inner transition-colors"
                        title={opt.label}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium bg-elevated text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer prompt */}
      {!loading && items.filter((i) => !i.is_processed).length > 5 && filter === 'unprocessed' && (
        <div className="flex-shrink-0 bg-accent/10 border border-accent/20 rounded-xl p-3 flex items-center gap-3">
          <span className="text-accent text-sm">⚡</span>
          <p className="text-xs text-sub">
            You have {items.filter((i) => !i.is_processed).length} unprocessed items. Take 5 minutes to route them!
          </p>
        </div>
      )}
    </div>
  );
}
