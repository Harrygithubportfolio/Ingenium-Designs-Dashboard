import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Dashboard",
  description: "Your daily life OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white flex">
        {/* Sidebar */}
        <aside className="w-64 h-screen bg-gray-900 border-r border-gray-800 p-6 fixed left-0 top-0">
          <h1 className="text-2xl font-bold mb-8">My Dashboard</h1>

          <nav className="space-y-4">
            <a href="/" className="block text-gray-300 hover:text-white">Dashboard</a>
            <a href="/weather" className="block text-gray-300 hover:text-white">Weather</a>
            <a href="/fitness" className="block text-gray-300 hover:text-white">Fitness & Nutrition</a>
            <a href="/focus" className="block text-gray-300 hover:text-white">Focus</a>
            <a href="/goals" className="block text-gray-300 hover:text-white">Goals</a>
            <a href="/chatbot" className="block text-gray-300 hover:text-white">AI Chatbot</a>
            <a href="/settings" className="block text-gray-300 hover:text-white">Settings</a>
          </nav>
        </aside>

        {/* Main content area */}
        <div className="flex-1 ml-64">
          {/* Top navigation bar */}
          <header className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-900/50 backdrop-blur">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Personal Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700">
                Refresh
              </button>
              <div className="w-8 h-8 rounded-full bg-gray-700"></div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}