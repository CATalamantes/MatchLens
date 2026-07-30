import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Crest from '../components/Crest'
import Skeleton from '../components/Skeleton'
import { API_URL } from '../config/api'

// Players lead. The fan leaderboard is kept behind a secondary tab rather than
// deleted — it may be scrapped, so it stays available without being the thing
// the page is about.
const TABS = ['Players', 'Fans']

const MEDALS = ['🥇', '🥈', '🥉']

function rankBadge(index) {
  return MEDALS[index] ?? `${index + 1}`
}

function PlayerRow({ player, index }) {
  return (
    <Link
      to={`/players/${player.id}`}
      className={`flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] ${
        index === 0 ? 'bg-primary/[0.06]' : ''
      }`}
    >
      <span className="w-8 shrink-0 text-[13px] font-bold text-white">{rankBadge(index)}</span>
      <Avatar
        name={player.name}
        src={player.photo}
        fit="contain"
        className="size-9 shrink-0 rounded-full bg-dash-sidebar"
        textClassName="text-[11px]"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[13px] font-bold text-white">{player.name}</p>
        <p className="truncate text-[11px] text-secondary">
          {[player.position, player.nationality].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="hidden w-[150px] shrink-0 items-center gap-2 sm:flex">
        <Crest label={player.team_name} logo={player.team_logo} className="size-4 rounded-sm" compact />
        <span className="truncate text-[12px] text-secondary">{player.team_name}</span>
      </div>
      <span className="w-16 shrink-0 text-right text-[12px] text-secondary">{player.assists}</span>
      <span className="w-16 shrink-0 text-right text-[16px] font-extrabold text-primary">
        {player.goals}
      </span>
    </Link>
  )
}

function FanRow({ user, index }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 ${index === 0 ? 'bg-primary/[0.06]' : ''}`}
    >
      <span className="w-8 shrink-0 text-[13px] font-bold text-white">{rankBadge(index)}</span>
      <Avatar
        name={user.username}
        src={user.profile_image_url}
        className="size-9 shrink-0 rounded-full"
        textClassName="text-[11px]"
      />
      <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">{user.username}</p>
      <span className="w-24 shrink-0 text-right text-[16px] font-extrabold text-primary">
        {(user.points ?? 0).toLocaleString()}
      </span>
    </div>
  )
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('Players')
  const [players, setPlayers] = useState([])
  const [fans, setFans] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      // Reuses the search endpoint — it already ranks by goals then assists
      // straight out of Postgres, so this costs no API requests.
      fetch(`${API_URL}/api/search?type=player&sort=goals`).then((r) => r.json()),
      fetch(`${API_URL}/api/users`).then((r) => r.json()),
    ])
      .then(([playersRes, fansRes]) => {
        const next = {}
        if (playersRes.status === 'fulfilled') setPlayers(playersRes.value.results ?? [])
        else next.players = 'Could not load the player rankings.'

        if (fansRes.status === 'fulfilled') setFans(Array.isArray(fansRes.value) ? fansRes.value : [])
        else next.fans = 'Could not load the fan rankings.'

        setErrors(next)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-white">Leaderboard</h1>
        <p className="text-[13px] text-secondary">
          FIFA World Cup 2022 — top performers of the tournament.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-dash">
        {TABS.map((tab) => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center gap-1.5 pb-2"
            >
              <span className={`text-[14px] ${active ? 'font-bold text-primary' : 'font-medium text-secondary'}`}>
                {tab === 'Players' ? 'Top Players' : 'Fan Rankings'}
              </span>
              <span className={`h-[3px] w-10 rounded-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && activeTab === 'Players' && (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-dash bg-dash-card">
          <div className="flex items-center gap-4 bg-dash-sidebar px-4 py-2.5 text-[11px] font-bold uppercase text-secondary">
            <span className="w-8 shrink-0">#</span>
            <span className="w-9 shrink-0" />
            <span className="flex-1">Player</span>
            <span className="hidden w-[150px] shrink-0 sm:block">Team</span>
            <span className="w-16 shrink-0 text-right">Assists</span>
            <span className="w-16 shrink-0 text-right">Goals</span>
          </div>

          {errors.players && <p className="p-4 text-[13px] text-dash-live">{errors.players}</p>}
          {!errors.players && players.length === 0 && (
            <p className="p-4 text-[13px] text-secondary">
              No player data yet — run <span className="font-mono text-primary">npm run sync</span>.
            </p>
          )}

          {players.map((player, index) => (
            <PlayerRow key={player.id} player={player} index={index} />
          ))}
        </div>
      )}

      {!loading && activeTab === 'Fans' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 rounded-xl border border-dash bg-dash-card p-4">
            <p className="text-[13px] font-bold text-white">About fan points</p>
            <p className="text-[12px] text-secondary">
              Fan points come from the demo accounts in the database. The prediction and
              wagering mechanics behind them aren't built yet, so this ranking is a
              placeholder for a feature that may not ship.
            </p>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-dash bg-dash-card">
            <div className="flex items-center gap-4 bg-dash-sidebar px-4 py-2.5 text-[11px] font-bold uppercase text-secondary">
              <span className="w-8 shrink-0">#</span>
              <span className="w-9 shrink-0" />
              <span className="flex-1">Fan</span>
              <span className="w-24 shrink-0 text-right">Points</span>
            </div>

            {errors.fans && <p className="p-4 text-[13px] text-dash-live">{errors.fans}</p>}
            {!errors.fans && fans.length === 0 && (
              <p className="p-4 text-[13px] text-secondary">No fans registered yet.</p>
            )}

            {fans.map((user, index) => (
              <FanRow key={user.id} user={user} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
