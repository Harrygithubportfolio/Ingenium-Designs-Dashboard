export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome back, Harry</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Today’s Weather</h2>
          <p className="text-gray-400">Check the forecast at a glance.</p>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Fitness & Nutrition</h2>
          <p className="text-gray-400">Track your progress and habits.</p>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Focus Mode</h2>
          <p className="text-gray-400">Stay on track with your tasks.</p>
        </div>
      </div>
    </div>
  );
}