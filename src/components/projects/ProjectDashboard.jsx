import { useState } from 'react'
import { useProjects } from '../../hooks/useProjects.js'
import StatusTabs from './StatusTabs.jsx'
import ProjectList from './ProjectList.jsx'
import SkeletonLoader from '../ui/SkeletonLoader.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ErrorState from '../ui/ErrorState.jsx'

export default function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState('ongoing')
  const [expandedProjects, setExpandedProjects] = useState({})
  const { projects, loading, error, refetch } = useProjects(activeTab)

  function toggleProject(id) {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    // Reset expanded state when switching tabs so the new list starts collapsed
    setExpandedProjects({})
  }

  return (
    <div>
      <StatusTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {loading && <SkeletonLoader />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && projects.length === 0 && <EmptyState tab={activeTab} />}
      {!loading && !error && projects.length > 0 && (
        <ProjectList
          projects={projects}
          expandedProjects={expandedProjects}
          onToggle={toggleProject}
        />
      )}
    </div>
  )
}
