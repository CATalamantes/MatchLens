import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Crest from '../components/Crest'
import Skeleton from '../components/Skeleton'
import { API_URL } from '../config/api'

function StarRating({ rating }) {
  // API-Football rates out of 10; the display is five stars.
  const filled = Math.round((Number(rating) || 0) / 2)
  return (
    <div className="flex items-center gap-0.5 text-[14px] text-primary">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < filled ? 'text-primary' : 'text-dash'}>
          ★
        </span>
      ))}
    </div>
  )
}

function StatBlock({ value, label }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-dash bg-dash-card p-4">
      <p className="text-[24px] font-extrabold text-primary">{value ?? '–'}</p>
      <p className="text-[11px] font-medium text-secondary">{label}</p>
    </div>
  )
}

export default function PlayerDetail() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    fetch(`${API_URL}/api/players/${playerId}`)
      .then((res) => {
        if (res.status === 404) return { notFound: true }
        if (!res.ok) throw new Error('Failed to load player')
        return res.json()
      })
      .then((data) => (data?.notFound ? setNotFound(true) : setPlayer(data)))
      .catch((err) => {
        console.error('Failed to load player', err)
        setError('Could not load this player. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [playerId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-[140px] w-full rounded-2xl" />
        <Skeleton className="h-[160px] w-full rounded-2xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="text-[16px] font-bold text-white">Player not found</p>
        <p className="text-[13px] text-secondary">
          This player doesn't have recorded stats for the tournament.
        </p>
        <Link to="/discover" className="text-[13px] font-semibold text-primary">
          ← Back to Teams &amp; Players
        </Link>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-dash-live">{error ?? 'Something went wrong.'}</p>
      </div>
    )
  }

  const statBlocks = [
    { value: player.goals, label: 'Goals' },
    { value: player.assists, label: 'Assists' },
    { value: player.appearances, label: 'Appearances' },
    { value: player.pass_accuracy != null ? `${player.pass_accuracy}%` : '–', label: 'Pass Accuracy' },
    { value: player.key_passes, label: 'Key Passes' },
    { value: player.shots_on, label: 'Shots on Target' },
  ]

  return (
    <div className="flex gap-6 p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-dash-card to-black" />
          <div className="relative flex flex-wrap items-center justify-between gap-6 p-6">
            <div className="flex items-center gap-5">
              <Avatar
                name={player.name}
                src={player.photo}
                className="size-20 rounded-full"
                textClassName="text-[24px]"
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-[28px] font-extrabold text-white">{player.name}</p>
                <Link
                  to={`/teams/${player.team_id}`}
                  className="flex items-center gap-2 text-[12px] font-bold text-primary"
                >
                  <Crest label={player.team} logo={player.team_logo} className="size-4 rounded-sm" compact />
                  {player.team}
                </Link>
                <p className="text-[11px] font-medium text-secondary">
                  {[player.position, player.nationality, player.age ? `${player.age} yrs` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            {player.rating && (
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-secondary">
                  Average Rating
                </p>
                <p className="text-[24px] font-extrabold text-primary">
                  {Number(player.rating).toFixed(2)}
                </p>
                <StarRating rating={player.rating} />
              </div>
            )}
          </div>
        </div>

        {/* Tournament stats */}
        <div className="flex flex-col gap-4">
          <p className="text-[18px] font-bold text-white">Tournament Stats</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {statBlocks.map((block) => (
              <StatBlock key={block.label} {...block} />
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-6 rounded-2xl border border-dash bg-dash-sidebar p-5">
        <p className="text-[15px] font-bold text-white">Minutes &amp; Output</p>
        <div className="flex flex-col gap-3 rounded-xl border border-dash bg-dash-card p-4 text-[12px]">
          <div className="flex items-center justify-between">
            <p className="text-secondary">Minutes played</p>
            <p className="font-bold text-white">{player.minutes}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-secondary">Total shots</p>
            <p className="font-bold text-white">{player.shots_total}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-secondary">Passes</p>
            <p className="font-bold text-white">{player.passes}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-secondary">Goal contributions</p>
            <p className="font-bold text-primary">{player.goals + player.assists}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
