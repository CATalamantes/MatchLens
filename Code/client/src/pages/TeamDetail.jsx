import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Crest from '../components/Crest'
import Skeleton from '../components/Skeleton'
import { useSessionUser } from '../hooks/useSessionUser'

const API_URL = import.meta.env.VITE_API_URL ?? ''

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TeamDetail() {
  const { teamId } = useParams()
  const sessionUser = useSessionUser()
  const userId = sessionUser?.id

  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [followedTeams, setFollowedTeams] = useState([])
  const [followBusy, setFollowBusy] = useState(false)
  const [followError, setFollowError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/api/teams/${teamId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Team not found')
        return res.json()
      })
      .then(setTeam)
      .catch(() => setError("Could not load this team — it may not be part of this tournament's data."))
      .finally(() => setLoading(false))
  }, [teamId])

  useEffect(() => {
    if (!userId) return
    fetch(`${API_URL}/api/follows/user/${userId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setFollowedTeams)
      .catch((err) => console.error('Failed to load followed teams', err))
  }, [userId])

  const existingFollow = followedTeams.find((f) => String(f.api_team_id) === String(teamId))

  async function handleToggleFollow() {
    if (!userId || !team) return
    setFollowBusy(true)
    setFollowError(null)
    try {
      if (existingFollow) {
        const res = await fetch(`${API_URL}/api/follows/${existingFollow.followed_team_id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Unfollow failed')
        setFollowedTeams((prev) => prev.filter((f) => f.followed_team_id !== existingFollow.followed_team_id))
      } else {
        const res = await fetch(`${API_URL}/api/follows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, api_team_id: team.id, team_name: team.name }),
        })
        if (!res.ok) throw new Error('Follow failed')
        const created = await res.json()
        setFollowedTeams((prev) => [...prev, created])
      }
    } catch (err) {
      setFollowError('Could not update follow status. Please try again.')
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-[150px] w-full rounded-2xl" />
        <Skeleton className="h-[180px] w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-dash-live">{error ?? 'Team not found.'}</p>
      </div>
    )
  }

  const groupRank = team.groupStandings.findIndex((row) => row.id === team.id) + 1

  const recentForm = [...team.fixtures]
    .filter((f) => f.home_score != null && f.away_score != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((f) => {
      const isHome = f.home === team.name
      const teamScore = isHome ? f.home_score : f.away_score
      const oppScore = isHome ? f.away_score : f.home_score
      const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D'
      return { key: f.id, result, score: `${f.home_score}-${f.away_score}` }
    })

  const upcomingFixtures = [...team.fixtures].sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="flex gap-6 p-6">
      <div className="flex flex-1 flex-col gap-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-dash-card to-black" />
          <div className="relative flex flex-wrap items-center justify-between gap-6 p-6">
            <div className="flex items-center gap-5">
              <Crest label={team.name} src={team.logo} className="size-20 rounded-full" textClassName="text-[26px]" />
              <div className="flex flex-col gap-1.5">
                <p className="text-[28px] font-extrabold text-white">{team.name}</p>
                <p className="text-[11px] font-bold text-primary">
                  {team.group} · Rank {groupRank || '—'}
                </p>
                <p className="text-[11px] font-medium text-secondary">
                  {team.wins}W {team.draws}D {team.losses}L · {team.points} pts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={!userId || followBusy}
              className={`shrink-0 rounded-lg border-[1.5px] border-primary px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50 ${
                existingFollow ? 'bg-primary/10 text-primary' : 'bg-transparent text-white'
              }`}
            >
              {existingFollow ? 'Following Team' : 'Follow Team'}
            </button>
          </div>
        </div>
        {followError && <p className="text-[12px] text-dash-live">{followError}</p>}

        {/* Recent form + metrics */}
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[18px] font-bold text-white">Recent Form</p>
            {recentForm.length === 0 ? (
              <p className="text-[12px] text-secondary">No completed matches yet.</p>
            ) : (
              <div className="flex items-center gap-3">
                {recentForm.map((entry) => (
                  <div key={entry.key} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        entry.result === 'W'
                          ? 'bg-primary text-dash-sidebar'
                          : entry.result === 'L'
                            ? 'bg-dash-live text-white'
                            : 'bg-dash-neutral text-white'
                      }`}
                    >
                      {entry.result}
                    </div>
                    <p className="text-[10px] text-secondary">{entry.score}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[18px] font-bold text-white">Tournament Metrics</p>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <p className="font-medium text-secondary">Goal Difference</p>
                <p className="font-semibold text-primary">
                  {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-secondary">Goals Scored</p>
                <p className="font-semibold text-white">{team.goals_scored}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-secondary">Goals Conceded</p>
                <p className="font-semibold text-white">{team.goals_conceded}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixtures */}
        <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
          <p className="text-[18px] font-bold text-white">Fixtures</p>
          {upcomingFixtures.length === 0 ? (
            <p className="text-[12px] text-secondary">No fixtures found for this team.</p>
          ) : (
            <div className="flex flex-col">
              {upcomingFixtures.map((fixture) => (
                <Link
                  key={fixture.id}
                  to={`/matches/${fixture.id}`}
                  className="flex items-center gap-4 border-b border-dash py-3 last:border-b-0 hover:bg-white/5"
                >
                  <div className="flex w-20 shrink-0 flex-col gap-0.5">
                    <p className="text-[11px] font-bold text-primary">{formatDate(fixture.date)}</p>
                    <p className="text-[11px] font-medium text-secondary">{fixture.time}</p>
                  </div>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex flex-1 items-center justify-end gap-1.5">
                      <p className="truncate text-[13px] font-semibold text-white">{fixture.home}</p>
                      <Crest compact label={fixture.home} className="size-4 rounded-sm" />
                    </div>
                    <p className="shrink-0 text-[11px] font-bold text-secondary">
                      {fixture.home_score ?? '–'} - {fixture.away_score ?? '–'}
                    </p>
                    <div className="flex flex-1 items-center gap-1.5">
                      <Crest compact label={fixture.away} className="size-4 rounded-sm" />
                      <p className="truncate text-[13px] font-semibold text-white">{fixture.away}</p>
                    </div>
                  </div>
                  <p className="w-[140px] shrink-0 truncate text-right text-[11px] font-medium text-secondary">
                    {fixture.venue}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Squad */}
        <div className="flex flex-col gap-4">
          <p className="text-[18px] font-bold text-white">Squad</p>
          {team.squad.length === 0 ? (
            <p className="text-[12px] text-secondary">Squad list isn't available for this team.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {team.squad.map((player) => (
                <div key={player.id} className="flex flex-col gap-3 rounded-xl border border-dash bg-dash-card p-4">
                  <Avatar name={player.name} src={player.photo} className="h-[130px] w-full rounded-lg" textClassName="text-[28px]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-caption font-bold uppercase text-primary">#{player.number ?? '–'}</p>
                    <p className="text-body-lg font-bold text-white">{player.name}</p>
                    <p className="text-caption text-secondary">{player.position}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-6 rounded-2xl border border-dash bg-dash-sidebar p-5">
        <p className="text-[15px] font-bold text-white">{team.group} Standings</p>
        <div className="flex flex-col overflow-hidden rounded-xl border border-dash bg-dash-card text-[11px]">
          <div className="flex gap-2 bg-dashboard p-2.5 font-bold text-secondary">
            <p className="w-[30px]">POS</p>
            <p className="flex-1">TEAM</p>
            <p className="w-10 text-right">PTS</p>
          </div>
          {team.groupStandings.map((row, index) => {
            const isCurrentTeam = row.id === team.id
            return (
              <div
                key={row.id}
                className={`flex items-center gap-2 p-2.5 ${isCurrentTeam ? 'bg-primary/10' : ''}`}
              >
                <p className={`w-[30px] font-bold ${isCurrentTeam ? 'text-primary' : 'text-white'}`}>{index + 1}</p>
                <p className="flex-1 truncate font-medium text-white">{row.name}</p>
                <p className={`w-10 text-right font-bold ${isCurrentTeam ? 'text-primary' : 'text-white'}`}>
                  {row.points}
                </p>
              </div>
            )
          })}
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg border border-dash bg-dashboard p-3">
          <p className="text-[12px] font-bold text-secondary">Tournament Favorites</p>
          <p className="text-[11px] text-secondary">Prediction modeling isn't wired up yet — in progress.</p>
        </div>
      </aside>
    </div>
  )
}
