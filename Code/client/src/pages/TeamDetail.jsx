import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Crest from '../components/Crest'
import Skeleton from '../components/Skeleton'
import { API_URL } from '../config/api'
import { isFinished } from '../utilities/matchStatus'
import { useFollows } from '../hooks/useFollows'

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Derives this team's result from a fixture, since the API reports scores by
// home/away rather than from any one team's perspective.
function resultFor(fixture, teamId) {
  const isHome = fixture.home_id === teamId
  const scored = isHome ? fixture.home_score : fixture.away_score
  const conceded = isHome ? fixture.away_score : fixture.home_score
  if (scored == null || conceded == null) return null
  if (scored > conceded) return { result: 'W', score: `${scored}-${conceded}` }
  if (scored < conceded) return { result: 'L', score: `${scored}-${conceded}` }
  return { result: 'D', score: `${scored}-${conceded}` }
}

export default function TeamDetail() {
  const { teamId } = useParams()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const { isFollowing, toggleFollow, error: followError, userId } = useFollows()

  useEffect(() => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    fetch(`${API_URL}/api/teams/${teamId}`)
      .then((res) => {
        if (res.status === 404) return { notFound: true }
        if (!res.ok) throw new Error('Failed to load team')
        return res.json()
      })
      .then((data) => (data?.notFound ? setNotFound(true) : setTeam(data)))
      .catch((err) => {
        console.error('Failed to load team', err)
        setError('Could not load this team. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [teamId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-[140px] w-full rounded-2xl" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="text-[16px] font-bold text-white">Team not found</p>
        <p className="text-[13px] text-secondary">This team didn't take part in the tournament.</p>
        <Link to="/discover" className="text-[13px] font-semibold text-primary">
          ← Back to Teams
        </Link>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-dash-live">{error ?? 'Something went wrong.'}</p>
      </div>
    )
  }

  const numericId = Number(teamId)
  const played = (team.fixtures ?? []).filter((f) => isFinished(f.status))
  const recentForm = played.slice(-5).map((f) => resultFor(f, numericId)).filter(Boolean)

  return (
    <div className="flex gap-6 p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-dash-card to-black" />
          <div className="relative flex flex-wrap items-center justify-between gap-6 p-6">
            <div className="flex items-center gap-5">
              <Crest label={team.name} logo={team.logo} className="size-20" textClassName="text-[26px]" />
              <div className="flex flex-col gap-1.5">
                <p className="text-[28px] font-extrabold text-white">{team.name}</p>
                <p className="text-[11px] font-bold text-primary">{team.group}</p>
                <p className="text-[11px] font-medium text-secondary">
                  {team.played} played · {team.wins}W {team.draws}D {team.losses}L · {team.points} pts
                </p>
              </div>
            </div>

            {userId && (
              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleFollow({ id: numericId, name: team.name })}
                  className={`shrink-0 rounded-lg border-[1.5px] border-primary px-4 py-2.5 text-[13px] font-semibold ${
                    isFollowing(numericId) ? 'bg-primary/10 text-primary' : 'bg-transparent text-white'
                  }`}
                >
                  {isFollowing(numericId) ? '✓ Following Team' : '+ Follow Team'}
                </button>
                {followError && <p className="text-[11px] text-dash-live">{followError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Form + metrics */}
        <div className="flex flex-wrap gap-4">
          <div className="flex min-w-[280px] flex-1 flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[18px] font-bold text-white">Recent Form</p>
            {recentForm.length === 0 ? (
              <p className="text-[13px] text-secondary">No completed matches.</p>
            ) : (
              <div className="flex items-center gap-3">
                {recentForm.map((entry, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        entry.result === 'W'
                          ? 'bg-primary text-dash-sidebar'
                          : entry.result === 'D'
                            ? 'bg-dash-input text-white'
                            : 'bg-dash-live text-white'
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

          <div className="flex min-w-[280px] flex-1 flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[18px] font-bold text-white">Tournament Metrics</p>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <p className="font-medium text-secondary">Goal Difference</p>
                <p className="font-semibold text-primary">{team.goal_diff}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-secondary">Goals Scored</p>
                <p className="font-semibold text-white">{team.goals_scored}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-secondary">Goals Conceded</p>
                <p className="font-semibold text-white">{team.goals_against}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixtures */}
        <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
          <p className="text-[18px] font-bold text-white">Tournament Fixtures</p>
          <div className="flex flex-col">
            {(team.fixtures ?? []).map((fixture) => (
              <Link
                key={fixture.id}
                to={`/matches/${fixture.id}`}
                className="flex items-center gap-4 border-b border-dash py-3 last:border-b-0 hover:bg-white/[0.03]"
              >
                <div className="flex w-24 shrink-0 flex-col gap-0.5">
                  <p className="text-[11px] font-bold text-primary">{formatDate(fixture.date)}</p>
                  <p className="text-[11px] font-medium text-secondary">{fixture.round}</p>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex flex-1 items-center justify-end gap-1.5">
                    <p className="truncate text-[13px] font-semibold text-white">{fixture.home}</p>
                    <Crest compact label={fixture.home} logo={fixture.home_logo} className="size-4 rounded-sm" />
                  </div>
                  <p className="shrink-0 text-[12px] font-bold text-primary">
                    {fixture.home_score ?? '–'} - {fixture.away_score ?? '–'}
                  </p>
                  <div className="flex flex-1 items-center gap-1.5">
                    <Crest compact label={fixture.away} logo={fixture.away_logo} className="size-4 rounded-sm" />
                    <p className="truncate text-[13px] font-semibold text-white">{fixture.away}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Squad */}
        <div className="flex flex-col gap-4">
          <p className="text-[18px] font-bold text-white">Squad</p>
          {(team.squad ?? []).length === 0 ? (
            <p className="text-[13px] text-secondary">Squad list isn't available for this team.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {team.squad.map((player) => (
                <Link
                  key={player.id}
                  to={`/players/${player.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-dash bg-dash-card p-4 hover:border-primary"
                >
                  <Avatar
                    name={player.name}
                    src={player.photo}
                    fit="contain"
                    className="h-[130px] w-full rounded-lg bg-dash-sidebar"
                    textClassName="text-[28px]"
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-caption font-bold uppercase text-primary">#{player.number ?? '–'}</p>
                    <p className="text-body-lg font-bold text-white">{player.name}</p>
                    <p className="text-caption text-secondary">{player.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-6 rounded-2xl border border-dash bg-dash-sidebar p-5">
        <p className="text-[15px] font-bold text-white">{team.group}</p>
        <div className="flex flex-col gap-3 rounded-xl border border-dash bg-dash-card p-4 text-[12px]">
          <div className="flex items-center justify-between">
            <p className="text-secondary">Points</p>
            <p className="font-bold text-primary">{team.points}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-secondary">Played</p>
            <p className="font-bold text-white">{team.played}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-secondary">Record</p>
            <p className="font-bold text-white">
              {team.wins}-{team.draws}-{team.losses}
            </p>
          </div>
          {team.form && (
            <div className="flex items-center justify-between">
              <p className="text-secondary">Group form</p>
              <p className="font-bold text-white">{team.form}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
