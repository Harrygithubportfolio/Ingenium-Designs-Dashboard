'use client';

import { useState, useMemo } from 'react';
import {
  focusTips,
  getDailyTip,
  TIP_CATEGORIES,
  type TipCategory,
  type FocusTip,
} from '../utils/focusTips';

type FilterCategory = 'all' | TipCategory;

export default function TipsWidget() {
  const dailyTip = useMemo(() => getDailyTip(), []);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBrowse, setShowBrowse] = useState(false);

  const filteredTips = useMemo(() => {
    if (filter === 'all') return focusTips;
    return focusTips.filter(t => t.category === filter);
  }, [filter]);

  const currentTip: FocusTip = showBrowse
    ? filteredTips[currentIndex % filteredTips.length]
    : dailyTip;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredTips.length) % filteredTips.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredTips.length);
  };

  const handleFilterChange = (cat: FilterCategory) => {
    setFilter(cat);
    setCurrentIndex(0);
    if (!showBrowse) setShowBrowse(true);
  };

  const categoryMeta = TIP_CATEGORIES[currentTip.category];

  return (
    <div className="h-full bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-semibold text-heading">
            {showBrowse ? 'Browse Tips' : 'Tip of the Day'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => { setShowBrowse(!showBrowse); setCurrentIndex(0); }}
          className="text-[10px] text-accent hover:text-heading transition-colors"
        >
          {showBrowse ? 'Daily tip' : 'Browse all'}
        </button>
      </div>

      {/* Category filters — only visible in browse mode */}
      {showBrowse && (
        <div className="flex gap-1 mb-3 flex-shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filter === 'all'
                ? 'bg-accent/20 text-accent'
                : 'bg-elevated text-dim hover:text-sub'
            }`}
          >
            All
          </button>
          {(Object.entries(TIP_CATEGORIES) as [TipCategory, { label: string; colour: string }][]).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleFilterChange(key)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                filter === key
                  ? 'bg-accent/20 text-accent'
                  : 'bg-elevated text-dim hover:text-sub'
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>
      )}

      {/* Tip content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${categoryMeta.colour}20`, color: categoryMeta.colour }}
          >
            {categoryMeta.label}
          </span>
        </div>

        <p className="text-sm font-medium text-heading mb-1.5">{currentTip.title}</p>
        <p className="text-xs text-sub leading-relaxed">{currentTip.content}</p>

        {currentTip.source && (
          <p className="text-[10px] text-dim mt-2 italic">— {currentTip.source}</p>
        )}
      </div>

      {/* Navigation — only in browse mode */}
      {showBrowse && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-edge flex-shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 text-dim hover:text-heading transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[10px] text-dim">
            {(currentIndex % filteredTips.length) + 1} / {filteredTips.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="p-1 text-dim hover:text-heading transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
