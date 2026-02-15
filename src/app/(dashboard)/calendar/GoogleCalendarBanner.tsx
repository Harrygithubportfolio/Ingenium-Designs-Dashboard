'use client';

import { useState } from 'react';
import { useCalendar } from '@/store/useCalendar';

export default function GoogleCalendarBanner() {
  const { connection, syncing, lastSyncError, triggerSync, disconnectGoogle } = useCalendar();
  const [showDisconnect, setShowDisconnect] = useState(false);

  if (!connection) {
    return (
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-card to-inner border border-edge">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-heading">Google Calendar</p>
            <p className="text-xs text-dim">Connect to sync your events</p>
          </div>
        </div>
        <a
          href="/api/calendar/google/auth"
          className="px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white hover:from-accent-hover hover:to-accent-secondary transition-all shadow-lg shadow-accent/20"
        >
          Connect
        </a>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-card border border-emerald-500/20">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-400">Google Calendar connected</p>
          {connection.last_synced_at && (
            <p className="text-[0.65rem] text-dim">
              Last synced: {new Date(connection.last_synced_at).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {lastSyncError && (
          <span className="text-[0.65rem] text-red-400">{lastSyncError}</span>
        )}

        <button
          type="button"
          onClick={triggerSync}
          disabled={syncing}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-elevated border border-edge text-sub hover:text-heading hover:border-emerald-500/50 transition-all disabled:opacity-50"
        >
          {syncing ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              Syncing...
            </span>
          ) : (
            'Sync Now'
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDisconnect(!showDisconnect)}
            className="px-2 py-1.5 text-xs rounded-lg bg-elevated border border-edge text-dim hover:text-sub transition-all"
            aria-label="Calendar options"
          >
            ...
          </button>
          {showDisconnect && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-elevated border border-edge rounded-lg shadow-xl overflow-hidden">
              <button
                type="button"
                onClick={async () => {
                  await disconnectGoogle();
                  setShowDisconnect(false);
                }}
                className="px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap"
              >
                Disconnect Google Calendar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
