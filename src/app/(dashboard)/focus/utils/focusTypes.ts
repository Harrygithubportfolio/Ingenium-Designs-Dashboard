// ============================================
// Re-export types from lib (Supabase-backed)
// ============================================

export type { FocusTask, DailyFocus, Reflection } from '@/lib/focus/types';

// ============================================
// QUOTE TYPE
// ============================================

export interface Quote {
  text: string;
  author: string;
}

// ============================================
// TIME OF DAY UTILITIES
// ============================================

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreeting(): string {
  const timeOfDay = getTimeOfDay();
  const greetings: Record<TimeOfDay, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  };
  return greetings[timeOfDay];
}

export function isMorningMode(): boolean {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 14; // Show morning mode until 2 PM
}

export function isEveningMode(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 5; // Show evening mode from 6 PM to 5 AM
}

// ============================================
// DATE UTILITIES
// ============================================

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-GB', options);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// INSPIRATIONAL QUOTES
// ============================================

export const inspirationalQuotes: Quote[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Small progress is still progress.", author: "Unknown" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getDailyQuote(): Quote {
  return inspirationalQuotes[getDayOfYear() % inspirationalQuotes.length];
}

// ============================================
// MINDSET PROMPTS
// ============================================

export const morningPrompts: string[] = [
  "What would make today great?",
  "What's the one thing I must accomplish today?",
  "How do I want to feel at the end of today?",
  "What's my intention for today?",
  "What would make me proud of today?",
];

export const eveningPrompts: string[] = [
  "What am I grateful for today?",
  "What did I learn today?",
  "How did I grow today?",
  "What brought me joy today?",
  "What would I do differently?",
];

export function getDailyMorningPrompt(): string {
  return morningPrompts[getDayOfYear() % morningPrompts.length];
}

export function getDailyEveningPrompt(): string {
  return eveningPrompts[getDayOfYear() % eveningPrompts.length];
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
