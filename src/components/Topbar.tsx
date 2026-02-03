'use client';

// Firebolt Logo SVG (same as in Sidebar)
function FireboltLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 2L4.09 12.11C3.69 12.59 3.48 12.83 3.48 13.11C3.47 13.35 3.57 13.58 3.75 13.74C3.96 13.93 4.29 13.97 4.95 14.06L10.93 14.84C11.12 14.87 11.21 14.88 11.28 14.93C11.34 14.97 11.38 15.02 11.41 15.09C11.44 15.17 11.44 15.26 11.43 15.45L11.01 21.11C10.97 21.68 10.95 21.97 11.06 22.14C11.16 22.29 11.32 22.39 11.5 22.41C11.71 22.43 11.95 22.26 12.44 21.91L21.19 15.65C21.82 15.2 22.14 14.98 22.24 14.7C22.33 14.46 22.31 14.19 22.18 13.97C22.03 13.71 21.67 13.55 20.96 13.22L15.07 10.44C14.89 10.35 14.8 10.31 14.74 10.24C14.68 10.18 14.65 10.11 14.63 10.03C14.62 9.94 14.64 9.84 14.69 9.65L16.31 3.37C16.47 2.75 16.55 2.44 16.46 2.23C16.38 2.05 16.22 1.92 16.03 1.88C15.81 1.83 15.53 1.97 14.97 2.24L13 2Z"
        fill="url(#firebolt-gradient-topbar)"
        stroke="url(#firebolt-gradient-topbar)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="firebolt-gradient-topbar" x1="4" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface TopbarProps {
  isPrimary: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onToggleCollapse: () => void;
}

export default function Topbar({ isPrimary, isCollapsed, onToggle, onToggleCollapse }: TopbarProps) {
  return (
    <header className="h-14 min-h-[56px] border-b border-[#2a2a33] flex items-center px-4 bg-[#0f0f14]/80 backdrop-blur-xl">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Show Firebolt logo button when sidebar is collapsed */}
        {isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 border border-[#3b82f6]/30 hover:border-[#3b82f6]/50 transition-all hover:scale-105"
            title="Show Sidebar"
          >
            <FireboltLogo className="w-5 h-5" />
          </button>
        )}

        {/* Primary/Secondary Toggle */}
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a22] border border-[#2a2a33] hover:border-[#3b82f6]/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isPrimary ? 'bg-[#3b82f6] shadow-lg shadow-blue-500/50' : 'bg-gray-600'
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-300 ${
                isPrimary ? 'text-[#3b82f6]' : 'text-gray-500'
              }`}
            >
              Primary
            </span>
          </div>
          <span className="text-gray-600">/</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                !isPrimary ? 'bg-[#3b82f6] shadow-lg shadow-blue-500/50' : 'bg-gray-600'
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-300 ${
                !isPrimary ? 'text-[#3b82f6]' : 'text-gray-500'
              }`}
            >
              Secondary
            </span>
          </div>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          type="button"
          title="Search"
          className="p-2 rounded-lg hover:bg-[#1a1a22] text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Notifications */}
        <button
          type="button"
          title="Notifications"
          className="p-2 rounded-lg hover:bg-[#1a1a22] text-gray-400 hover:text-white transition-colors relative"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#3b82f6] ring-2 ring-[#0f0f14]" />
        </button>

        {/* Profile */}
        <button
          type="button"
          className="ml-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-purple-600 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-[#2a2a33] hover:ring-[#3b82f6]/50 transition-all"
        >
          H
        </button>
      </div>
    </header>
  );
}
