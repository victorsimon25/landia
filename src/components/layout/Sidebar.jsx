import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Map, LogOut, LogIn, Sparkles, Lock, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderOpen, requiresAuth: true },
  { to: '/map', label: 'State Map', icon: Map, requiresAuth: true },
]

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleNavClick(e, item) {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault()
      setShowAuthModal(true)
    }
  }

  return (
    <>
    <div className="w-14 flex-shrink-0 relative">
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`absolute top-0 left-0 h-full bg-white/75 backdrop-blur-xl border-r border-white/60 flex flex-col py-4 overflow-hidden transition-all duration-200 z-30 ${
          expanded ? 'w-56 px-2 shadow-xl' : 'w-14 px-2'
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
                  `w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    expanded ? 'gap-3 px-3' : 'justify-center px-2'
                  } ${
                    isActive && isAuthenticated
                      ? 'bg-brand/10 text-brand font-semibold'
                      : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {expanded && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Divider + Lanzer AI — only when authenticated */}
        {isAuthenticated && (
          <>
            <div className={`my-3 border-t border-slate-200/80 ${expanded ? 'mx-2' : 'mx-3'}`} />
            <NavLink
              to="/lanzer"
              className={({ isActive }) =>
                `w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  expanded ? 'gap-3 px-3' : 'justify-center px-2'
                } ${
                  isActive
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                }`
              }
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              {expanded && <span className="whitespace-nowrap">Lanzer AI</span>}
            </NavLink>
          </>
        )}

        {/* Bottom section */}
        <div className="mt-auto border-t border-white/40 pt-4">
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
              className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-brand hover:bg-brand/10 transition-colors ${
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

      {/* Auth modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-slate-500" />
            </div>

            <h2 className="text-base font-bold text-slate-900 text-center mb-1">
              You're not signed in
            </h2>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              Sign in to access Projects, State Map, and other features.
            </p>

            <button
              onClick={() => { setShowAuthModal(false); navigate('/login') }}
              className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 mt-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
