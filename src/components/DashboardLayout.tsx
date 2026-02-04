'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// Context for sidebar state
interface SidebarContextType {
  isCollapsed: boolean;
  isPrimary: boolean;
  toggleCollapse: () => void;
  toggleMenu: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within DashboardLayout');
  }
  return context;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isPrimary, setIsPrimary] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsPrimary((prev) => !prev);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isPrimary, toggleCollapse, toggleMenu }}>
      <div className="h-screen w-screen overflow-hidden bg-[#0f0f14] text-white flex">
        {/* Sidebar */}
        <Sidebar isPrimary={isPrimary} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'ml-0' : 'ml-64'
          }`}
        >
          {/* Top Navigation Bar */}
          <Topbar
            isPrimary={isPrimary}
            isCollapsed={isCollapsed}
            onToggle={toggleMenu}
            onToggleCollapse={toggleCollapse}
          />

          {/* Page Content - fills remaining height */}
          <main className="flex-1 min-h-0 overflow-hidden p-3 md:p-4">
            <div className="h-full overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
