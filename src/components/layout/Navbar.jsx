import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import Logo from '../ui/Logo.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initial = user?.name?.[0]?.toUpperCase() ?? 'U'

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <header className="h-14 bg-white/75 backdrop-blur-xl border-b border-white/60 shadow-sm flex items-center px-4 sm:px-6 lg:px-8 flex-shrink-0 z-40 relative">
      <div className="flex items-center gap-2 flex-1">
        <Logo />
        <span className="text-lg font-bold text-slate-900 tracking-tight">Landia</span>
      </div>

      {/* User avatar with sign-out dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-semibold select-none hover:opacity-85 transition-opacity"
          title={user?.name ?? 'Account'}
        >
          {initial}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white/90 backdrop-blur-xl rounded-xl border border-white/60 shadow-xl py-1 z-50">
            {user && (
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
