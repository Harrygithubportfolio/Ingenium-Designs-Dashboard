'use client';

import { useEffect } from 'react';
import { useSpotify } from '@/store/useSpotify';

export default function PlaylistBrowser() {
  const { playlists, playlistsLoading, fetchPlaylists, playContext } =
    useSpotify();

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  if (playlistsLoading) {
    return (
      <div className="bg-card rounded-2xl border border-edge p-4 flex flex-col gap-3 overflow-hidden">
        <p className="text-xs font-medium text-dim uppercase tracking-wider px-1">
          Your Playlists
        </p>
        <div className="flex-1 overflow-y-auto space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-elevated flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 w-3/4 rounded bg-elevated" />
                <div className="h-2 w-1/2 rounded bg-elevated" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-edge p-6 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center">
          <svg className="w-6 h-6 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm text-sub">No playlists found</p>
        <p className="text-xs text-dim">Create a playlist in Spotify to see it here</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-edge p-4 flex flex-col gap-3 overflow-hidden">
      <p className="text-xs font-medium text-dim uppercase tracking-wider px-1">
        Your Playlists
      </p>
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {playlists.map((playlist) => {
          const coverArt =
            playlist.images?.[0]?.url ?? playlist.images?.[1]?.url;

          return (
            <button
              key={playlist.id}
              type="button"
              onClick={() => playContext(playlist.uri)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-elevated transition-colors group text-left cursor-pointer"
            >
              {coverArt ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={coverArt}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-elevated flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-heading truncate group-hover:text-[#1db954] transition-colors">
                  {playlist.name}
                </p>
                <p className="text-xs text-dim truncate">
                  {playlist.tracks.total} tracks &middot; {playlist.owner.display_name}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
