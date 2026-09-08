import { useState, useEffect, useCallback } from 'react'
import { getNationalStats } from '../services/nationalService.js'

export function useNationalStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getNationalStats()
      setStats(data)
    } catch (err) {
      setError(err.message || 'Failed to load national statistics')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
