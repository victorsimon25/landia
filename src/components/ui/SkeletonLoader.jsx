export default function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 w-5 h-5 rounded bg-slate-200 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="h-5 w-48 rounded bg-slate-200" />
                <div className="h-5 w-24 rounded-full bg-slate-100" />
                <div className="h-5 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="h-2 rounded-full bg-slate-100 mb-3" />
              <div className="flex gap-6">
                <div className="h-3.5 w-28 rounded bg-slate-100" />
                <div className="h-3.5 w-28 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
