import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import LoadingScreen from '../ui/LoadingScreen.jsx'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location, signinMessage: 'Sign in to continue' }} />
  }
  return <Outlet />
}
