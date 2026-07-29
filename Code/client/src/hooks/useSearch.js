import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_URL } from '../config/api'

// Search state lives in the URL so results are shareable and the browser's
// back button steps through queries the way it does on a real search engine.
// Replaces the old useTeamSearch, which only filtered a hardcoded array.
export function useSearch() {
  const [params, setParams] = useSearchParams()

  const query = params.get('q') ?? ''
  const filters = {
    type: params.get('type') ?? 'all',
    position: params.get('position') ?? '',
    group: params.get('group') ?? '',
    number: params.get('number') ?? '',
    sort: params.get('sort') ?? '',
  }
  const page = Math.max(1, parseInt(params.get('page')) || 1)

  // A search is "active" once the user has typed or narrowed something —
  // that's what flips the page from the landing view to results.
  const hasSearched =
    query.trim() !== '' ||
    filters.type !== 'all' ||
    Boolean(filters.position || filters.group || filters.number || filters.sort)

  const [data, setData] = useState({ results: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Guards against a slow early request landing after a faster later one and
  // overwriting fresher results.
  const requestId = useRef(0)

  useEffect(() => {
    if (!hasSearched) {
      setData({ results: [], total: 0 })
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(null)

    const search = new URLSearchParams({ q: query, page: String(page) })
    for (const [key, value] of Object.entries(filters)) {
      if (value) search.set(key, value)
    }

    // Debounced so typing doesn't fire a request per keystroke.
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/search?${search}`)
        .then((res) => {
          if (!res.ok) throw new Error('Search failed')
          return res.json()
        })
        .then((body) => {
          if (id === requestId.current) setData(body)
        })
        .catch((err) => {
          if (id === requestId.current) setError(err.message)
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false)
        })
    }, 250)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page, filters.type, filters.position, filters.group, filters.number, filters.sort])

  function update(next, { resetPage = true } = {}) {
    const merged = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === '' || value == null) merged.delete(key)
      else merged.set(key, value)
    }
    // Changing a filter should return to page 1 — staying on page 3 of a
    // narrower result set usually lands on nothing.
    if (resetPage) merged.delete('page')
    setParams(merged, { replace: true })
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true })
  }

  return { query, filters, page, hasSearched, ...data, loading, error, update, clearAll }
}
