import { useEffect, useState } from 'react'
import { fetchStateMapData } from '../services/mapService.js'

export function useMapData() {
  const [states, setStates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function load() {
    setLoading(true)
    setError(null)
    fetchStateMapData()
      .then((data) => setStates(data.states))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return { states, loading, error, refetch: load }
}
