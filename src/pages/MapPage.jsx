import { Map } from 'lucide-react'
import { useMapData } from '../hooks/useMapData.js'
import ErrorState from '../components/ui/ErrorState.jsx'

// When the backend is ready:
// 1. Uncomment the fetch block in src/services/mapService.js
// 2. Replace <MapPlaceholder /> below with your actual map component,
//    passing `states` from useMapData() as props.

function MapPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Map className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-base font-semibold text-slate-700 mb-2">Interactive Map Coming Soon</p>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed">
        State-level drill-down requires the backend endpoint{' '}
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
          GET /api/map/states
        </code>
        . Once connected, clicking a state will show detailed acquisition progress.
      </p>
    </div>
  )
}

export default function MapPage() {
  const { states, loading, error, refetch } = useMapData()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">State-wise Progress</h1>
        <p className="text-sm text-slate-500">
          Interactive map showing land acquisition progress across all states.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-96">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-500">Loading map data…</p>
          </div>
        )}

        {!loading && error && (
          // Backend not yet connected — show placeholder instead of error for this known case
          error === 'State map API is not yet available'
            ? <MapPlaceholder />
            : <ErrorState message={error} onRetry={refetch} />
        )}

        {!loading && !error && states && (
          // Replace this div with your actual map component when backend is ready:
          // <IndiaMap states={states} onStateClick={(state) => navigate(`/map/${state.id}`)} />
          <div className="text-sm text-slate-500 text-center py-20">
            {states.length} states loaded — map component not yet wired up.
          </div>
        )}
      </div>
    </div>
  )
}
