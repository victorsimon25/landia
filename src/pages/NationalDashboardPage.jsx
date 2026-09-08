import NationalDashboard from '../components/national/NationalDashboard.jsx'

export default function NationalDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-block w-1 h-7 rounded-full bg-brand flex-shrink-0" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            National Land Acquisition
          </h1>
        </div>
        <p className="text-sm text-slate-500 pl-4">
          Overview of land acquisition progress across all projects and states.
        </p>
      </div>
      <NationalDashboard />
    </div>
  )
}
