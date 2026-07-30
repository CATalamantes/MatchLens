import { useCallback, useEffect, useState } from 'react'
import { useSessionUser } from './useSessionUser'
import { API_URL } from '../config/api'

// One place that owns follow state, so the sidebar, team pages and search
// results all agree on what's followed and all write the same `api_team_id`
// (the real API-Football team id) rather than each inventing its own.
export function useFollows() {
  const sessionUser = useSessionUser()
  const userId = sessionUser?.id

  const [follows, setFollows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!userId) {
      setFollows([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`${API_URL}/api/follows/user/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load followed teams')
        return res.json()
      })
      .then(setFollows)
      .catch((err) => {
        console.error('Failed to load follows', err)
        setError('Could not load your followed teams.')
      })
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(load, [load])

  const isFollowing = useCallback(
    (teamId) => follows.some((f) => String(f.api_team_id) === String(teamId)),
    [follows],
  )

  // `team` needs { id, name }. Returns true when the state actually changed so
  // callers can decide whether to surface an error.
  const toggleFollow = useCallback(
    async (team) => {
      if (!userId) return false
      setError(null)
      const existing = follows.find((f) => String(f.api_team_id) === String(team.id))

      try {
        if (existing) {
          const res = await fetch(`${API_URL}/api/follows/${existing.followed_team_id}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error('Unfollow failed')
          setFollows((prev) =>
            prev.filter((f) => f.followed_team_id !== existing.followed_team_id),
          )
        } else {
          const res = await fetch(`${API_URL}/api/follows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              api_team_id: String(team.id),
              team_name: team.name,
            }),
          })
          if (!res.ok) throw new Error('Follow failed')
          const created = await res.json()
          setFollows((prev) => [...prev, created])
        }
        return true
      } catch (err) {
        console.error('Follow toggle failed', err)
        setError('Could not update follow status. Please try again.')
        return false
      }
    },
    [follows, userId],
  )

  return { follows, loading, error, isFollowing, toggleFollow, reload: load, userId }
}

// The API doesn't return a logo on a followed_teams row (the table only stores
// id + name), but API-Football serves crests at a predictable path — so this
// avoids both a schema change and an extra request.
export function teamLogoUrl(apiTeamId) {
  return `https://media.api-sports.io/football/teams/${apiTeamId}.png`
}
