import { Link } from 'react-router-dom'
import Crest from './Crest'
import { isLive, statusLabel } from '../utilities/matchStatus'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function MatchCard({ match }) {
  const { id, home, home_logo, away, away_logo, home_score, away_score, status, minute, date } = match
  const live = isLive(status)

  return (
    <Link
      to={`/matches/${id}`}
      className="flex flex-col gap-3 rounded-xl border border-dash bg-dash-card p-3 hover:border-primary"
    >
      <div className="flex items-start justify-between gap-2 text-overline whitespace-nowrap">
        <p className="font-semibold text-secondary">{formatDate(date)}</p>
        <p className={live ? 'font-bold text-dash-live' : 'font-bold text-secondary'}>
          {statusLabel(status, minute)}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Crest compact label={home} logo={home_logo} className="size-4 rounded-sm" />
          <p className="flex-1 truncate text-[12px] font-semibold text-white">{home}</p>
        </div>
        <div className="flex w-full items-center justify-center rounded-md bg-dash-sidebar px-2 py-1">
          <p className="text-[14px] font-bold text-primary">
            {home_score ?? '–'} - {away_score ?? '–'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Crest compact label={away} logo={away_logo} className="size-4 rounded-sm" />
          <p className="flex-1 truncate text-[12px] font-semibold text-white">{away}</p>
        </div>
      </div>
    </Link>
  )
}
