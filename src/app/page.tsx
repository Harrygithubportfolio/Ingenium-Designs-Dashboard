export default function Home() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, <span className="text-[#3b82f6]">Harry</span>
        </h1>
        <p className="text-gray-400">
          Here&apos;s your life at a glance. Stay focused, stay intentional.
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          label="Focus Time Today"
          value="4h 32m"
          change="+12%"
          positive
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <QuickStat
          label="Tasks Completed"
          value="12 / 15"
          change="80%"
          positive
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <QuickStat
          label="Calories Burned"
          value="1,847"
          change="+340"
          positive
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
        />
        <QuickStat
          label="Weekly Goal Progress"
          value="67%"
          change="+5%"
          positive
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Today's Weather"
          description="Clear skies with a high of 22°C. Perfect day for a walk."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          accentColor="from-yellow-500 to-orange-500"
          href="/weather"
        />

        <DashboardCard
          title="Fitness & Nutrition"
          description="You've logged 8,432 steps today. 1,568 more to reach your goal."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          accentColor="from-red-500 to-pink-500"
          href="/fitness"
        />

        <DashboardCard
          title="Focus Mode"
          description="Next deep work session scheduled in 2 hours. 3 tasks pending."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          accentColor="from-[#3b82f6] to-cyan-500"
          href="/focus"
        />

        <DashboardCard
          title="Goals Tracker"
          description="2 goals on track, 1 needs attention. Monthly review in 5 days."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          accentColor="from-green-500 to-emerald-500"
          href="/goals"
        />

        <DashboardCard
          title="AI Assistant"
          description="Ready to help with planning, research, or just a quick chat."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          accentColor="from-purple-500 to-violet-500"
          href="/chatbot"
        />

        <DashboardCard
          title="Quick Notes"
          description="3 unprocessed notes from today. Tap to review and organize."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
          accentColor="from-amber-500 to-yellow-500"
          href="/notes"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="dashboard-card bg-[#1a1a22] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <button type="button" className="text-sm text-[#3b82f6] hover:text-blue-400 transition-colors">
            View all
          </button>
        </div>
        <div className="space-y-4">
          <ActivityItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Completed morning workout"
            time="2 hours ago"
            color="text-green-400"
          />
          <ActivityItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Started deep work session"
            time="4 hours ago"
            color="text-[#3b82f6]"
          />
          <ActivityItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            }
            title="Updated weekly goals"
            time="Yesterday"
            color="text-purple-400"
          />
        </div>
      </div>
    </div>
  );
}

// Quick Stat Component
function QuickStat({
  label,
  value,
  change,
  positive,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="dashboard-card bg-[#1a1a22] rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-[#22222c] text-[#3b82f6]">{icon}</div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            positive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {change}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({
  title,
  description,
  icon,
  accentColor,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  href: string;
}) {
  return (
    <a href={href} className="block group">
      <div className="dashboard-card bg-[#1a1a22] rounded-2xl p-6 h-full">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-[#3b82f6] transition-colors">
          {title}
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        <div className="mt-4 flex items-center gap-2 text-[#3b82f6] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Open</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </a>
  );
}

// Activity Item Component
function ActivityItem({
  icon,
  title,
  time,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#22222c] transition-colors">
      <div className={`p-2 rounded-lg bg-[#22222c] ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}
