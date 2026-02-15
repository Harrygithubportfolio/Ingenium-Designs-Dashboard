'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isPrimary: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Firebolt Logo SVG
function FireboltLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 2L4.09 12.11C3.69 12.59 3.48 12.83 3.48 13.11C3.47 13.35 3.57 13.58 3.75 13.74C3.96 13.93 4.29 13.97 4.95 14.06L10.93 14.84C11.12 14.87 11.21 14.88 11.28 14.93C11.34 14.97 11.38 15.02 11.41 15.09C11.44 15.17 11.44 15.26 11.43 15.45L11.01 21.11C10.97 21.68 10.95 21.97 11.06 22.14C11.16 22.29 11.32 22.39 11.5 22.41C11.71 22.43 11.95 22.26 12.44 21.91L21.19 15.65C21.82 15.2 22.14 14.98 22.24 14.7C22.33 14.46 22.31 14.19 22.18 13.97C22.03 13.71 21.67 13.55 20.96 13.22L15.07 10.44C14.89 10.35 14.8 10.31 14.74 10.24C14.68 10.18 14.65 10.11 14.63 10.03C14.62 9.94 14.64 9.84 14.69 9.65L16.31 3.37C16.47 2.75 16.55 2.44 16.46 2.23C16.38 2.05 16.22 1.92 16.03 1.88C15.81 1.83 15.53 1.97 14.97 2.24L13 2Z"
        fill="url(#firebolt-gradient)"
        stroke="url(#firebolt-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="firebolt-gradient" x1="4" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-secondary)' }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// SVG Icons
const Icons = {
  Health: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Inbox: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
    </svg>
  ),
  Calendar: () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
),
  Weather: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  Fitness: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Focus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Goals: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  Spotify: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Work: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Finance: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  SelfImprovement: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Mind: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Entertainment: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Admin: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Experiments: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  LifeMap: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
};

const primaryNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <Icons.Dashboard /> },
  { name: 'Calendar', href: '/calendar', icon: <Icons.Calendar /> },
  { name: 'Weather', href: '/weather', icon: <Icons.Weather /> },
  { name: 'Fitness & Nutrition', href: '/fitness-nutrition', icon: <Icons.Fitness /> },
  { name: 'Health', href: '/health', icon: <Icons.Health /> },
  { name: 'Focus', href: '/focus', icon: <Icons.Focus /> },
  { name: 'Goals', href: '/goals', icon: <Icons.Goals /> },
  { name: 'Spotify', href: '/spotify', icon: <Icons.Spotify /> },
  { name: 'Settings', href: '/settings', icon: <Icons.Settings /> },
];

const secondaryNavItems: NavItem[] = [
  { name: 'Work & Projects', href: '/work', icon: <Icons.Work /> },
  { name: 'Finance', href: '/finance', icon: <Icons.Finance /> },
  { name: 'Home & Lifestyle', href: '/home', icon: <Icons.Home /> },
  { name: 'Self-Improvement', href: '/self-improvement', icon: <Icons.SelfImprovement /> },
  { name: 'Mind & Mental', href: '/mind', icon: <Icons.Mind /> },
  { name: 'Entertainment', href: '/entertainment', icon: <Icons.Entertainment /> },
  { name: 'Reviews', href: '/reviews', icon: <Icons.Admin /> },
  { name: 'Experiments', href: '/experiments', icon: <Icons.Experiments /> },
  { name: 'Life Map', href: '/life-map', icon: <Icons.LifeMap /> },
];

export default function Sidebar({ isPrimary, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const navItems = isPrimary ? primaryNavItems : secondaryNavItems;
  const sectionTitle = isPrimary ? 'Primary' : 'Secondary';

  return (
    <aside
      className={`${styles.sidebar} fixed left-0 top-0 h-screen bg-card border-r border-edge flex flex-col z-50 transition-transform duration-300 ease-in-out ${
        isCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`}
    >
      {/* Logo / Brand - Toggle Button */}
      <div className="p-4 border-b border-edge">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-elevated transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center border border-accent/30 group-hover:border-accent/50 transition-colors">
            <FireboltLogo className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold text-heading">Life OS</h1>
            <p className="text-xs text-dim">Personal Dashboard</p>
          </div>
          <svg
            className="w-4 h-4 text-dim ml-auto group-hover:text-sub transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="sidebar-section" key={isPrimary ? 'primary' : 'secondary'}>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-dim">
            {sectionTitle}
          </p>
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href ||
                (item.href === '/fitness-nutrition' && (pathname.startsWith('/fitness') || pathname.startsWith('/nutrition')));
              return (
                <li
                  key={item.href}
                  style={{ '--animation-delay': `${index * 30}ms` } as React.CSSProperties}
                  className={`sidebar-section ${styles.sidebarItem}`}
                >
                  <Link
                    href={item.href}
                    className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'active text-accent bg-accent/10'
                        : 'text-sub hover:text-heading hover:bg-elevated'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                      isActive ? 'bg-accent text-white' : 'bg-elevated group-hover:bg-accent/20'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-edge">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-elevated transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
            H
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-heading truncate">Harry</p>
            <p className="text-xs text-dim truncate">Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
