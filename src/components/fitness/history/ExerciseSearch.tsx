'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchDistinctExercises } from '@/lib/fitness/queries';
import { createClient } from '@/lib/supabase/client';

interface Props {
  onSelect: (exerciseName: string) => void;
  selected: string | null;
}

export default function ExerciseSearch({ onSelect, selected }: Props) {
  const [exercises, setExercises] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    fetchDistinctExercises(supabase)
      .then(setExercises)
      .catch((err) => console.error('fetchDistinctExercises error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query
    ? exercises.filter((e) => e.toLowerCase().includes(query.toLowerCase()))
    : exercises;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Loading exercises...' : 'Search exercises...'}
          disabled={loading}
          className="w-full pl-9 pr-3 py-2 text-sm bg-inner border border-edge rounded-lg text-heading placeholder:text-dim focus:outline-none focus:border-accent disabled:opacity-50"
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onSelect('');
            }}
            aria-label="Clear selection"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-dim hover:text-heading hover:bg-edge transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-card border border-edge rounded-lg shadow-xl">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onSelect(name);
                setQuery(name);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-elevated transition-colors ${
                name === selected ? 'text-accent bg-accent/5' : 'text-heading'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {open && !loading && filtered.length === 0 && query && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-edge rounded-lg shadow-xl p-3">
          <p className="text-xs text-dim">No exercises found matching &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
