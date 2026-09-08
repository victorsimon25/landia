import { useState, useEffect, useCallback } from 'react'
import { getProjects } from '../services/projectService.js'

/**
 * Fetches projects for the given status tab.
 * Re-fetches automatically when `status` changes.
 *
 * @param {'ongoing'|'completed'} status
 * @returns {{ projects: Array, loading: boolean, error: string|null, refetch: Function }}
 */
export function useProjects(status) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjects(status)
      setProjects(data)
    } catch (err) {
      setError(err.message || 'Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, loading, error, refetch: fetchProjects }
}
