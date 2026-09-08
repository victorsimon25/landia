import ProjectDashboard from '../components/projects/ProjectDashboard.jsx'

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-block w-1 h-7 rounded-full bg-brand flex-shrink-0" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
        </div>
        <p className="text-sm text-slate-500 pl-4">Track and manage land acquisition projects.</p>
      </div>
      <ProjectDashboard />
    </div>
  )
}
