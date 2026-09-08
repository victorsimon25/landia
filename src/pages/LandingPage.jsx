import { Link, Navigate } from 'react-router-dom'
import { MapPin, BarChart2, DollarSign, Users } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import LoadingScreen from '../components/ui/LoadingScreen.jsx'
import PublicNavbar from '../components/layout/PublicNavbar.jsx'

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Track Projects',
    description:
      'Monitor land acquisition progress across all infrastructure projects in real time.',
  },
  {
    icon: DollarSign,
    title: 'Compensation',
    description:
      'Track assessed, disbursed, and pending compensation for affected landowners.',
  },
  {
    icon: Users,
    title: 'R&R Progress',
    description:
      'Monitor rehabilitation and resettlement status for displaced families.',
  },
]

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/national-land-acquisition" replace />

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">
            Landia
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight max-w-2xl">
          National Land Acquisition
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mb-10 leading-relaxed">
          Integrated platform for tracking land acquisition, compensation, and rehabilitation
          across infrastructure projects nationwide.
        </p>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </main>

      {/* Feature cards */}
      <section className="w-full max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
