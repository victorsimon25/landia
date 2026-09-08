import { Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Navbar from './Navbar.jsx'
import PublicNavbar from './PublicNavbar.jsx'
import Sidebar from './Sidebar.jsx'
import LoadingScreen from '../ui/LoadingScreen.jsx'

export default function RootLayout() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {isAuthenticated ? <Navbar /> : <PublicNavbar />}
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
