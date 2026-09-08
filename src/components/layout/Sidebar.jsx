import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Map, LogOut, LogIn } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

const NAV_ITEMS = [
  { to: '/', label: 'National Land Acquisition', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderOpen, requiresAuth: true },
  { to: '/map', label: 'State Map', icon: Map, requiresAuth: true },
]

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleNavClick(e, item) {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault()
      navigate('/login', { state: { signinMessage: 'Sign in to continue' } })
    }
  }

  return (
    <div className="w-14 flex-shrink-0 relative">
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`absolute top-0 left-0 h-full bg-white border-r border-slate-200 flex flex-col py-4 overflow-hidden transition-all duration-200 z-30 ${
          expanded ? 'w-56 px-2 shadow-lg' : 'w-14 px-2'
        }`}
      >
        {/* Nav items */}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={(e) => handleNavClick(e, item)}
                className={({ isActive }) =>
                  `flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    expanded ? 'gap-3 px-3' : 'justify-center px-2'
                  } ${
                    isActive && isAuthenticated
                      ? 'bg-slate-100 text-primary-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {expanded && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto border-t border-slate-200 pt-4">
          {isAuthenticated ? (
            <>
              {expanded && user && (
                <div className="px-3 py-2 mb-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors ${
                  expanded ? 'gap-3 px-3' : 'justify-center px-2'
                }`}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {expanded && <span className="whitespace-nowrap">Logout</span>}
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors ${
                expanded ? 'gap-3 px-3' : 'justify-center px-2'
              }`}
            >
              <LogIn className="w-4 h-4 flex-shrink-0" />
              {expanded && <span className="whitespace-nowrap">Sign In</span>}
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
