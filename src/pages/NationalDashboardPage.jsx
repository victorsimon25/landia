import NationalDashboard from '../components/national/NationalDashboard.jsx'

export default function NationalDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          National Land Acquisition
        </h1>
        <p className="text-sm text-slate-500">
          Overview of land acquisition progress across all projects and states.
        </p>
      </div>
      <NationalDashboard />
    </div>
  )
}
