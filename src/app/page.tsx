export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome back</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">System Status</h2>
          <p className="text-gray-400">Everything is running smoothly.</p>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Network</h2>
          <p className="text-gray-400">No issues detected.</p>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Automations</h2>
          <p className="text-gray-400">3 active workflows.</p>
        </div>
      </div>
    </div>
  );
}