import { ChevronLeft } from 'lucide-react'
import Logo from '../ui/Logo.jsx'

export default function AuthCard({ children, onBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <Logo className="h-8 w-8" />
          <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
            National Land Acquisition
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
