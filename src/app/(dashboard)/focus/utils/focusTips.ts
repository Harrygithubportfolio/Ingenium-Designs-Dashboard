// ============================================
// Focus Tips — Curated productivity, concentration & well-being tips
// ============================================

export type TipCategory = 'concentration' | 'productivity' | 'wellbeing';

export interface FocusTip {
  id: string;
  category: TipCategory;
  title: string;
  content: string;
  source?: string;
}

export const TIP_CATEGORIES: Record<TipCategory, { label: string; colour: string }> = {
  concentration: { label: 'Concentration', colour: '#f59e0b' },
  productivity: { label: 'Productivity', colour: '#3b82f6' },
  wellbeing: { label: 'Well-being', colour: '#10b981' },
};

export const focusTips: FocusTip[] = [
  // === CONCENTRATION ===
  {
    id: 'conc-1',
    category: 'concentration',
    title: 'The Two-Minute Rule',
    content: 'If a task takes less than two minutes, do it immediately. This prevents small tasks from piling up and fragmenting your focus.',
    source: 'David Allen',
  },
  {
    id: 'conc-2',
    category: 'concentration',
    title: 'Single-Tasking',
    content: 'Multitasking reduces productivity by up to 40%. Focus on one task at a time and you\'ll complete each one faster and better.',
  },
  {
    id: 'conc-3',
    category: 'concentration',
    title: 'The 90-Minute Rule',
    content: 'Your brain naturally cycles through periods of high and low alertness roughly every 90 minutes. Work in 90-minute blocks, then take a proper break.',
  },
  {
    id: 'conc-4',
    category: 'concentration',
    title: 'Reduce Decision Fatigue',
    content: 'Pre-plan routine decisions the night before — what to wear, what to eat, what to work on first. Save your mental energy for what matters.',
  },
  {
    id: 'conc-5',
    category: 'concentration',
    title: 'The Five-Second Rule',
    content: 'When you feel the urge to procrastinate, count 5-4-3-2-1 and physically move towards the task. Action creates motivation, not the other way around.',
    source: 'Mel Robbins',
  },
  {
    id: 'conc-6',
    category: 'concentration',
    title: 'Environmental Design',
    content: 'Your environment shapes your focus. Remove distractions before you begin — phone in another room, browser tabs closed, desk clear.',
  },
  {
    id: 'conc-7',
    category: 'concentration',
    title: 'The Parking Lot Method',
    content: 'Keep a notepad nearby. When unrelated thoughts pop up during focused work, jot them down and return to your task. Deal with them later.',
  },
  {
    id: 'conc-8',
    category: 'concentration',
    title: 'Deep Work Blocks',
    content: 'Schedule 2-4 hours of uninterrupted deep work each day. Protect this time fiercely — no meetings, no notifications, no context switching.',
    source: 'Cal Newport',
  },
  {
    id: 'conc-9',
    category: 'concentration',
    title: 'Start With the Hardest Task',
    content: 'Tackle your most demanding task when your energy is highest — usually first thing in the morning. This is often called "eating the frog".',
    source: 'Brian Tracy',
  },
  {
    id: 'conc-10',
    category: 'concentration',
    title: 'Music for Focus',
    content: 'Instrumental music, lo-fi beats, or nature sounds can improve concentration. Avoid music with lyrics — they compete for your language processing.',
  },
  {
    id: 'conc-11',
    category: 'concentration',
    title: 'The Zeigarnik Effect',
    content: 'Your brain fixates on unfinished tasks. Use this to your advantage — start a task before a break and your mind will naturally want to complete it when you return.',
  },
  {
    id: 'conc-12',
    category: 'concentration',
    title: 'Batch Similar Tasks',
    content: 'Group similar activities together — all emails at once, all calls in one block, all writing in a session. Context switching between different task types drains mental energy.',
  },

  // === PRODUCTIVITY ===
  {
    id: 'prod-1',
    category: 'productivity',
    title: 'The 1-3-5 Rule',
    content: 'Plan each day with 1 big task, 3 medium tasks, and 5 small tasks. This keeps your list realistic and ensures you tackle what matters most.',
  },
  {
    id: 'prod-2',
    category: 'productivity',
    title: 'Time Blocking',
    content: 'Assign specific time blocks to specific tasks in your calendar. What gets scheduled gets done. Treat these blocks like appointments you can\'t miss.',
  },
  {
    id: 'prod-3',
    category: 'productivity',
    title: 'The Eisenhower Matrix',
    content: 'Sort tasks by urgency and importance. Do urgent + important tasks now. Schedule important but not urgent ones. Delegate or eliminate the rest.',
    source: 'Dwight Eisenhower',
  },
  {
    id: 'prod-4',
    category: 'productivity',
    title: 'Weekly Review',
    content: 'Spend 30 minutes each week reviewing what you accomplished, what\'s pending, and what to focus on next. This keeps you aligned with your goals.',
    source: 'David Allen',
  },
  {
    id: 'prod-5',
    category: 'productivity',
    title: 'The Pareto Principle',
    content: '80% of your results come from 20% of your efforts. Identify the tasks that create the most value and prioritise them relentlessly.',
  },
  {
    id: 'prod-6',
    category: 'productivity',
    title: 'Say No More Often',
    content: 'Every "yes" to something unimportant is a "no" to something that matters. Protect your time by declining requests that don\'t align with your priorities.',
  },
  {
    id: 'prod-7',
    category: 'productivity',
    title: 'The Two-List Strategy',
    content: 'Write down your top 25 goals. Circle the top 5. The remaining 20 become your "avoid at all costs" list — they\'re the distractions disguised as priorities.',
    source: 'Warren Buffett',
  },
  {
    id: 'prod-8',
    category: 'productivity',
    title: 'Done Is Better Than Perfect',
    content: 'Perfectionism is procrastination in disguise. Ship the 80% version, then iterate. Progress beats perfection every time.',
  },
  {
    id: 'prod-9',
    category: 'productivity',
    title: 'Energy Management',
    content: 'Track your energy levels throughout the day. Schedule creative work during peak hours and routine tasks during dips. Your productivity follows your energy, not just your time.',
  },
  {
    id: 'prod-10',
    category: 'productivity',
    title: 'The Ivy Lee Method',
    content: 'At the end of each day, write down the 6 most important tasks for tomorrow. Rank them by importance. Start with #1 and don\'t move on until it\'s done.',
    source: 'Ivy Lee',
  },
  {
    id: 'prod-11',
    category: 'productivity',
    title: 'Capture Everything',
    content: 'Don\'t rely on your brain to remember tasks and ideas. Write them down immediately in a trusted system. A clear mind is a productive mind.',
  },
  {
    id: 'prod-12',
    category: 'productivity',
    title: 'Automate the Repetitive',
    content: 'If you do something more than twice, consider automating or templating it. Small efficiencies compound dramatically over time.',
  },

  // === WELL-BEING ===
  {
    id: 'well-1',
    category: 'wellbeing',
    title: 'The 20-20-20 Rule',
    content: 'Every 20 minutes, look at something 20 feet away for 20 seconds. This reduces eye strain and gives your brain a micro-reset.',
  },
  {
    id: 'well-2',
    category: 'wellbeing',
    title: 'Movement Breaks',
    content: 'Take a 5-minute movement break every hour. A short walk, some stretches, or even standing up can boost both energy and cognitive function.',
  },
  {
    id: 'well-3',
    category: 'wellbeing',
    title: 'Hydration and Focus',
    content: 'Even mild dehydration (1-2%) impairs concentration and increases fatigue. Keep water within arm\'s reach and sip regularly throughout the day.',
  },
  {
    id: 'well-4',
    category: 'wellbeing',
    title: 'Sleep Is Productivity',
    content: 'Getting 7-9 hours of quality sleep improves focus, creativity, and decision-making more than any productivity hack. Protect your sleep schedule.',
  },
  {
    id: 'well-5',
    category: 'wellbeing',
    title: 'Morning Sunlight',
    content: 'Get 10-15 minutes of natural sunlight within the first hour of waking. This regulates your circadian rhythm and improves alertness for the entire day.',
    source: 'Andrew Huberman',
  },
  {
    id: 'well-6',
    category: 'wellbeing',
    title: 'Mindful Breathing',
    content: 'When feeling overwhelmed, take 3 slow, deep breaths. Inhale for 4 seconds, hold for 4, exhale for 6. This activates your parasympathetic nervous system.',
  },
  {
    id: 'well-7',
    category: 'wellbeing',
    title: 'Digital Sunset',
    content: 'Reduce screen time 1-2 hours before bed. Blue light suppresses melatonin production. Switch to reading, journalling, or gentle stretching instead.',
  },
  {
    id: 'well-8',
    category: 'wellbeing',
    title: 'Gratitude Practice',
    content: 'Writing down 3 things you\'re grateful for each day rewires your brain to notice the positive. This reduces stress and improves overall well-being.',
  },
  {
    id: 'well-9',
    category: 'wellbeing',
    title: 'Nature Exposure',
    content: 'Spending just 20 minutes in nature significantly reduces cortisol levels. Even looking at natural scenery through a window has measurable stress-reducing effects.',
  },
  {
    id: 'well-10',
    category: 'wellbeing',
    title: 'Social Connection',
    content: 'Meaningful social interaction is essential for mental health. Schedule regular catch-ups with friends or family — connection fuels resilience and happiness.',
  },
  {
    id: 'well-11',
    category: 'wellbeing',
    title: 'Body Scan Awareness',
    content: 'Pause and scan your body from head to toes. Notice any tension — jaw, shoulders, hands. Simply noticing and releasing tension can immediately reduce stress.',
  },
  {
    id: 'well-12',
    category: 'wellbeing',
    title: 'Power of Naps',
    content: 'A 10-20 minute nap between 1-3pm can restore alertness without grogginess. Keep it short — longer naps can interfere with nighttime sleep.',
  },
];

export function getDailyTip(): FocusTip {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return focusTips[dayOfYear % focusTips.length];
}

export function getTipsByCategory(category: TipCategory): FocusTip[] {
  return focusTips.filter(tip => tip.category === category);
}
