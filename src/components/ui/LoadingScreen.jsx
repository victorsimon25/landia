import Logo from './Logo.jsx'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <Logo className="h-14 w-14 mb-1" />
      <span className="text-lg font-bold text-slate-900 tracking-tight">
        National Land Acquisition
      </span>
      <p className="text-sm text-slate-500">Checking authentication…</p>
    </div>
  )
}
