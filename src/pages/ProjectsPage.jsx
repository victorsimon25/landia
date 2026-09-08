import ProjectDashboard from '../components/projects/ProjectDashboard.jsx'

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Projects</h1>
        <p className="text-sm text-slate-500">Track and manage your projects in one place.</p>
      </div>
      <ProjectDashboard />
    </div>
  )
}
