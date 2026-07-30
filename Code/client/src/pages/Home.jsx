import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MatchCard from '../components/MatchCard'
import PlayerCard from '../components/PlayerCard'
import StandingsTable from '../components/StandingsTable'
import TournamentBracket from '../components/TournamentBracket'
import Crest from '../components/Crest'
import Skeleton from '../components/Skeleton'
import { useSessionUser } from '../hooks/useSessionUser'
import { useFollows } from '../hooks/useFollows'
import { API_URL } from '../config/api'
import { isFinished } from '../utilities/matchStatus'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request to ${url} failed`)
  return res.json()
}

export default function Home() {
  const sessionUser = useSessionUser()
  const { follows } = useFollows()
  const [teams, setTeams] = useState([])
  const [topScorers, setTopScorers] = useState([])
  const [bracket, setBracket] = useState([])
  const [user, setUser] = useState(null)

  const [loading, setLoading] = useState(true)
  // Per-section errors instead of one page-level flag: a single failing
  // endpoint used to blank the entire dashboard, which is what made this page
  // look broken even when most of its data had loaded fine.
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.allSettled([
      fetchJson(`${API_URL}/api/teams`),
      fetchJson(`${API_URL}/api/players?sort=goals`),
      fetchJson(`${API_URL}/api/matches/bracket`),
    ])
      .then(([teamsRes, playersRes, bracketRes]) => {
        if (cancelled) return
        const next = {}

        if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value)
        else next.teams = 'Standings are unavailable right now.'

        if (playersRes.status === 'fulfilled') setTopScorers(playersRes.value.slice(0, 3))
        else next.players = 'Player stats are unavailable right now.'

        if (bracketRes.status === 'fulfilled') setBracket(bracketRes.value)
        else next.bracket = 'The bracket is unavailable right now.'

        setErrors(next)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionUser?.id) return
    fetchJson(`${API_URL}/api/users/${sessionUser.id}`)
      .then(setUser)
      .catch((err) => console.error('Failed to load user', err))
  }, [sessionUser?.id])

  const final = bracket.find((r) => r.round === 'Final')?.matches?.[0]
  const champion = final?.home_winner ? final.home : final?.away_winner ? final.away : null
  const championLogo = final?.home_winner ? final.home_logo : final?.away_logo

  // Followed teams matched against the standings, so the Home block shows real
  // league position rather than just a list of names.
  const followedRows = teams.filter((team) =>
    follows.some((f) => String(f.api_team_id) === String(team.id)),
  )

  // 32 teams arrive as one flat list; the group label is what turns them back
  // into the eight tables a World Cup actually has.
  const groups = teams.reduce((acc, team) => {
    const key = team.group ?? 'Standings'
    if (!acc[key]) acc[key] = []
    acc[key].push(team)
    return acc
  }, {})

  return (
    <div className="flex gap-6 p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Hero — the tournament is complete, so it leads with the result */}
        {loading ? (
          <Skeleton className="h-[136px] w-full rounded-2xl" />
        ) : (
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-dash-card to-black" />
            <div className="relative flex flex-wrap items-center justify-between gap-6 p-6">
              <div className="flex max-w-[440px] flex-col gap-2">
                <span className="inline-flex w-fit items-center rounded bg-primary px-2 py-1 text-[10px] font-bold text-black">
                  FIFA WORLD CUP 2022
                </span>
                {final ? (
                  <>
                    <h1 className="text-[24px] font-extrabold text-white">
                      {final.home} {final.home_score}–{final.away_score} {final.away}
                    </h1>
                    <p className="text-[13px] text-primary">
                      Final · {final.venue}
                      {final.score_penalty?.home != null &&
                        ` · ${final.score_penalty.home}–${final.score_penalty.away} on penalties`}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] text-secondary">Tournament data is loading.</p>
                )}
              </div>

              {champion && (
                <div className="flex items-center gap-3 rounded-xl bg-black/30 p-4">
                  <Crest label={champion} logo={championLogo} className="size-12" />
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-secondary">Champions</p>
                    <p className="text-[18px] font-extrabold text-white">{champion}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tournament Path */}
        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
          <h2 className="text-[16px] font-bold text-white">Tournament Path</h2>

          {errors.bracket && <p className="text-[13px] text-dash-live">{errors.bracket}</p>}
          {loading && <Skeleton className="h-[240px] w-full rounded-xl" />}

          {!loading && !errors.bracket && <TournamentBracket rounds={bracket} />}
        </section>

        {/* Your Followed Teams — the wireframe's standings block, narrowed to
            the teams this user actually follows. */}
        <section className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-white">Your Followed Teams</h2>
            <Link to="/discover" className="text-[11px] font-bold text-primary">
              FIND TEAMS
            </Link>
          </div>

          {followedRows.length === 0 ? (
            <p className="text-[13px] text-secondary">
              You're not following anyone yet — follow a team and it'll show up here and in the
              sidebar.
            </p>
          ) : (
            <StandingsTable teams={followedRows} />
          )}
        </section>

        {/* Group standings */}
        <section className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
          <h2 className="text-[16px] font-bold text-white">Group Stage Standings</h2>

          {errors.teams && <p className="text-[13px] text-dash-live">{errors.teams}</p>}
          {loading && (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!loading && !errors.teams && teams.length === 0 && (
            <p className="text-[13px] text-secondary">No standings available right now.</p>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Object.entries(groups).map(([group, groupTeams]) => (
              <div key={group} className="flex flex-col gap-2">
                <p className="text-[12px] font-bold text-secondary">{group}</p>
                <StandingsTable teams={groupTeams} />
              </div>
            ))}
          </div>
        </section>

        {/* Top scorers */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-white">Top Scorers</h2>
          {errors.players && <p className="text-[13px] text-dash-live">{errors.players}</p>}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[220px] w-full rounded-xl" />
              ))}
            </div>
          ) : topScorers.length === 0 && !errors.players ? (
            <p className="text-[13px] text-secondary">No player stats available right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topScorers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-6 rounded-2xl border border-dash bg-dash-sidebar p-5">
        <p className="text-[14px] font-bold text-white">Knockout Results</p>

        {loading ? (
          <Skeleton className="h-[92px] w-full rounded-xl" />
        ) : final ? (
          <div className="flex flex-col gap-3">
            {bracket
              .filter((r) => r.round === 'Semi-finals' || r.round === 'Final')
              .flatMap((r) => r.matches)
              .filter((m) => isFinished(m.status))
              .map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
          </div>
        ) : (
          <p className="text-[12px] text-secondary">No results available.</p>
        )}

        <div className="h-px w-full bg-dash" />

        <div className="flex flex-col gap-3 rounded-xl border border-dash bg-dashboard p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-secondary">Your Points</p>
            <p className="text-[16px] font-extrabold text-primary">
              {(user?.points ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <Link
          to="/leaderboard"
          className="flex items-center justify-center rounded-lg bg-primary p-3.5 text-[13px] font-bold text-black"
        >
          ENTER LEADERBOARD
        </Link>
      </aside>
    </div>
  )
}
