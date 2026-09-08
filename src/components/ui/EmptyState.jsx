import { FolderOpen } from 'lucide-react'

export default function EmptyState({ tab }) {
  const isOngoing = tab === 'ongoing'
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        No {isOngoing ? 'ongoing' : 'completed'} projects
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        {isOngoing
          ? 'Projects that are currently active will appear here.'
          : 'Projects you have successfully completed will appear here.'}
      </p>
    </div>
  )
}
