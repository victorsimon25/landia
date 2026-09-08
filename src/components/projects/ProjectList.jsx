import ProjectCard from './ProjectCard.jsx'

export default function ProjectList({ projects, expandedProjects, onToggle }) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isExpanded={!!expandedProjects[project.id]}
          onToggle={() => onToggle(project.id)}
        />
      ))}
    </div>
  )
}
