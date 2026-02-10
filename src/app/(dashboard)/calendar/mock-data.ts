export interface CalendarEvent {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  description?: string;
}

const mockEvents: CalendarEvent[] = [
  {
    id: 1,
    title: 'Morning Meeting',
    date: '2026-02-10',
    time: '09:00',
    location: 'Office',
    description: 'Weekly sync with the team.',
  },
  {
    id: 2,
    title: 'Gym Session',
    date: '2026-02-11',
    time: '18:00',
    location: 'PureGym',
  },
  {
    id: 3,
    title: 'Client Call',
    date: '2026-02-13',
    time: '14:00',
    location: 'Zoom',
    description: 'Discuss project milestones.',
  },
];

export default mockEvents;