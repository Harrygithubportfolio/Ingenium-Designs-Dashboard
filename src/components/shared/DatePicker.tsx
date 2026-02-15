'use client';

interface DatePickerProps {
  value: string; // ISO date YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, label, className = '' }: DatePickerProps) {
  const today = new Date().toISOString().slice(0, 10);

  const handlePrev = () => {
    const d = new Date(value);
    d.setDate(d.getDate() - 1);
    onChange(d.toISOString().slice(0, 10));
  };

  const handleNext = () => {
    const d = new Date(value);
    d.setDate(d.getDate() + 1);
    onChange(d.toISOString().slice(0, 10));
  };

  const isToday = value === today;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-dim uppercase tracking-wide mr-1">{label}</span>}
      <button
        type="button"
        onClick={handlePrev}
        className="w-7 h-7 rounded-lg bg-elevated flex items-center justify-center text-sub hover:text-heading hover:bg-inner transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-inner border border-edge text-heading text-sm font-medium min-w-[140px] text-center"
      />
      <button
        type="button"
        onClick={handleNext}
        disabled={isToday}
        className="w-7 h-7 rounded-lg bg-elevated flex items-center justify-center text-sub hover:text-heading hover:bg-inner transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  );
}
