import { Link, useLocation } from 'react-router-dom'
import Logo from '../ui/Logo.jsx'

export default function PublicNavbar() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <Link to="/" className="flex items-center gap-2 flex-1">
        <Logo />
        <span className="text-lg font-bold text-slate-900 tracking-tight">Landia</span>
      </Link>
      {!isAuthPage && (
        <Link
          to="/login"
          className="px-4 py-1.5 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
        >
          Sign In
        </Link>
      )}
    </header>
  )
}
