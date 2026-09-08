import { ChevronRight } from 'lucide-react'
import ProjectDetails from './ProjectDetails.jsx'

const TYPE_COLORS = {
  'National Highway': 'bg-blue-50 text-blue-700',
  Railway: 'bg-purple-50 text-purple-700',
  Industrial: 'bg-orange-50 text-orange-700',
  'Metro Rail': 'bg-teal-50 text-teal-700',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export default function ProjectCard({ project, isExpanded, onToggle }) {
  const isCompleted = project.status === 'completed'
  const progressColor = isCompleted ? 'bg-green-500' : 'bg-blue-500'
  const typeBadge = TYPE_COLORS[project.type] || 'bg-slate-100 text-slate-600'

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-lg overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:bg-white/75 hover:ring-2 hover:ring-brand hover:shadow-xl hover:-translate-y-0.5">
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
        aria-expanded={isExpanded}
      >
        {/* Expand arrow */}
        <ChevronRight
          className={`w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-300 ${
            isExpanded ? 'rotate-90' : 'rotate-0'
          }`}
        />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-slate-900 truncate">{project.name}</h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${typeBadge}`}
            >
              {project.type}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-400/25'
                  : 'bg-brand/10 text-brand border border-brand/20'
              }`}
            >
              {isCompleted ? 'Completed' : 'In Progress'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex-1 h-1.5 rounded-full bg-white/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${project.overallProgressPercent}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 flex-shrink-0 w-10 text-right">
              {project.overallProgressPercent}%
            </span>
          </div>

          {/* Date row */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
            <span>Started: {formatDate(project.startDate)}</span>
            <span>Target: {formatDate(project.targetCompletionDate)}</span>
            {project.currentDelayMonths > 0 && (
              <span className="text-red-500 font-medium">
                +{project.currentDelayMonths}mo delay
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Collapsible details — smooth grid-rows animation */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <ProjectDetails project={project} />
        </div>
      </div>
    </div>
  )
}
