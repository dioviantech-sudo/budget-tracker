import { useState, useCallback } from 'react'
import api from '../api/client'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (method, url, data = null, params = null) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api({ method, url, data, params })
      return res.data
    } catch (err) {
      setError(err.response?.data || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { request, loading, error }
}
