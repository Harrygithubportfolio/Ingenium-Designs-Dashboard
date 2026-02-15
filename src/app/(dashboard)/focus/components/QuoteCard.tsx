'use client';

import { getDailyQuote } from '../utils/focusTypes';

interface QuoteCardProps {
  variant?: 'default' | 'compact';
}

export default function QuoteCard({ variant = 'default' }: QuoteCardProps) {
  const quote = getDailyQuote();

  if (variant === 'compact') {
    return (
      <div className="p-4 bg-gradient-to-br from-card to-inner rounded-xl border border-edge relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-3 relative">
          <svg className="w-5 h-5 text-accent/60 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-sub italic leading-relaxed">{quote.text}</p>
            <p className="text-xs text-dim mt-1">— {quote.author}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-5 bg-gradient-to-br from-card to-inner rounded-2xl border border-edge flex flex-col justify-center relative overflow-hidden group">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none transition-all group-hover:bg-accent/10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Quote icon */}
      <div className="mb-4">
        <svg className="w-8 h-8 text-accent/40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      {/* Quote text */}
      <blockquote className="relative">
        <p className="text-lg md:text-xl text-heading font-medium leading-relaxed mb-3 italic">
          &ldquo;{quote.text}&rdquo;
        </p>
        <footer className="flex items-center gap-2">
          <div className="w-6 h-px bg-gradient-to-r from-accent to-purple-500" />
          <cite className="text-sm text-sub not-italic">{quote.author}</cite>
        </footer>
      </blockquote>
    </div>
  );
}
