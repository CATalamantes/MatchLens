import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Crest from '../components/Crest'
import StatBar from '../components/StatBar'
import MatchComments from '../components/MatchComments'
import MatchEvents from '../components/MatchEvents'
import LineupPitch from '../components/LineupPitch'
import PossessionCard from '../components/PossessionCard'
import { API_URL } from '../config/api'
import { isLive, statusLabel } from '../utilities/matchStatus'

const TABS = ['Overview', 'Lineup', 'Stats', 'Comments']

// The stats worth surfacing, in wireframe order. Keys are exactly the `type`
// strings API-Football uses, which is why they're spelled out rather than
// derived — the upstream names are the contract.
const KEY_STATS = [
  { label: 'Shots', key: 'Total Shots' },
  { label: 'Shots on Target', key: 'Shots on Goal' },
  { label: 'Pass Accuracy', key: 'Passes %' },
  { label: 'Fouls', key: 'Fouls' },
]

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Statistic values come through as numbers ("20") or percentage strings
// ("83%"); both need to be numeric for the bars to size correctly.
function toNumber(value) {
  if (value == null) return 0
  return parseInt(value) || 0
}

function fetchJson(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Request to ${url} failed`)
    return res.json()
  })
}

export default function MatchDetail() {
  const { matchId } = useParams()
  const [activeTab, setActiveTab] = useState('Overview')

  const [match, setMatch] = useState(null)
  const [events, setEvents] = useState([])
  const [lineups, setLineups] = useState([])
  const [statistics, setStatistics] = useState([])

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(null)
  // Per-section errors, so a missing lineup doesn't blank the events timeline.
  const [sectionErrors, setSectionErrors] = useState({})

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setError(null)
    setSectionErrors({})

    // allSettled, not all: these endpoints fail independently and a match with
    // no recorded lineup should still show its score, events and stats.
    Promise.allSettled([
      fetch(`${API_URL}/api/matches/${matchId}`).then((res) => {
        if (res.status === 404) return { notFound: true }
        if (!res.ok) throw new Error('Failed to load match')
        return res.json()
      }),
      fetchJson(`${API_URL}/api/matches/${matchId}/events`),
      fetchJson(`${API_URL}/api/matches/${matchId}/lineups`),
      fetchJson(`${API_URL}/api/matches/${matchId}/statistics`),
    ])
      .then(([matchRes, eventsRes, lineupsRes, statsRes]) => {
        if (matchRes.status === 'fulfilled' && matchRes.value?.notFound) {
          setNotFound(true)
        } else if (matchRes.status === 'fulfilled') {
          setMatch(matchRes.value)
        } else {
          setError('Could not load this match. Please try again.')
        }

        const errors = {}
        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value)
        else errors.events = "Events aren't available for this match."

        if (lineupsRes.status === 'fulfilled') setLineups(lineupsRes.value)
        else errors.lineups = "Lineups aren't available for this match."

        if (statsRes.status === 'fulfilled') setStatistics(statsRes.value)
        else errors.statistics = "Statistics aren't available for this match."

        setSectionErrors(errors)
      })
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-secondary">Loading match…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="text-[16px] font-bold text-white">Match not found</p>
        <p className="text-[13px] text-secondary">This match doesn't exist or may have been removed.</p>
        <Link to="/matches" className="text-[13px] font-semibold text-primary">
          ← Back to Matches
        </Link>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-dash-live">{error ?? 'Something went wrong.'}</p>
      </div>
    )
  }

  const homeStats = statistics.find((s) => s.team_id === match.home_id)?.stats ?? {}
  const awayStats = statistics.find((s) => s.team_id === match.away_id)?.stats ?? {}
  const hasStats = statistics.length > 0

  const homePossession = toNumber(homeStats['Ball Possession']) || null
  const awayPossession = toNumber(awayStats['Ball Possession']) || null

  // Only knockout ties that went to spot kicks carry a penalty score.
  const penalties = match.score_penalty
  const wentToPenalties = penalties?.home != null && penalties?.away != null

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link to="/matches" className="text-secondary hover:text-primary">
          Matches
        </Link>
        <span className="text-secondary">›</span>
        <span className="font-semibold text-white">
          {match.home} vs {match.away}
        </span>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-dash bg-dash-card">
        <div className="flex items-center justify-between gap-4 p-6">
          <Link to={`/teams/${match.home_id}`} className="flex flex-1 flex-col items-center gap-3">
            <Crest label={match.home} logo={match.home_logo} className="size-20" />
            <p className="text-center text-[22px] font-extrabold text-white">{match.home}</p>
            <span className="text-[12px] text-secondary">Home</span>
          </Link>

          <div className="flex shrink-0 flex-col items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                isLive(match.status)
                  ? 'border border-dash-live bg-dash-live/10 text-dash-live'
                  : 'border border-dash text-secondary'
              }`}
            >
              {statusLabel(match.status, match.minute)}
            </span>
            <p className="text-[40px] font-extrabold leading-none text-white">
              {match.home_score ?? '–'} <span className="text-secondary">:</span> {match.away_score ?? '–'}
            </p>
            {wentToPenalties && (
              <p className="text-[12px] font-semibold text-primary">
                {penalties.home}–{penalties.away} on penalties
              </p>
            )}
            <p className="text-[11px] font-bold uppercase tracking-wide text-secondary">
              {match.league} · {match.round}
            </p>
          </div>

          <Link to={`/teams/${match.away_id}`} className="flex flex-1 flex-col items-center gap-3">
            <Crest label={match.away} logo={match.away_logo} className="size-20" />
            <p className="text-center text-[22px] font-extrabold text-white">{match.away}</p>
            <span className="text-[12px] text-secondary">Away</span>
          </Link>
        </div>

        <div className="border-t border-dash px-6 py-3">
          <p className="text-[12px] text-secondary">
            {formatDate(match.date)}
            {match.venue ? ` · ${match.venue}` : ''}
            {match.city ? `, ${match.city}` : ''}
          </p>
        </div>
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
                {tab}
              </span>
              <span className={`h-[3px] w-10 rounded-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      {/* Overview — the wireframe's three-column grid */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr_1fr]">
          <div className="flex flex-col gap-6">
            <MatchEvents
              events={events}
              error={sectionErrors.events}
              homeId={match.home_id}
            />
            <PossessionCard
              home={{ name: match.home, logo: match.home_logo }}
              away={{ name: match.away, logo: match.away_logo }}
              homePercent={homePossession}
              awayPercent={awayPossession}
              error={sectionErrors.statistics}
            />
          </div>

          <LineupPitch lineups={lineups} error={sectionErrors.lineups} />

          <div className="flex flex-col gap-5 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[16px] font-bold text-white">Key Stats</p>
            {sectionErrors.statistics && (
              <p className="text-[13px] text-dash-live">{sectionErrors.statistics}</p>
            )}
            {!sectionErrors.statistics && !hasStats && (
              <p className="text-[13px] text-secondary">
                Statistics weren't recorded for this match.
              </p>
            )}
            {hasStats &&
              KEY_STATS.map(({ label, key }) => (
                <StatBar
                  key={key}
                  label={label}
                  homeValue={toNumber(homeStats[key])}
                  awayValue={toNumber(awayStats[key])}
                />
              ))}
          </div>
        </div>
      )}

      {activeTab === 'Lineup' && <LineupPitch lineups={lineups} error={sectionErrors.lineups} />}

      {activeTab === 'Stats' && (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[16px] font-bold text-white">Full Match Statistics</p>
            {sectionErrors.statistics && (
              <p className="text-[13px] text-dash-live">{sectionErrors.statistics}</p>
            )}
            {!sectionErrors.statistics && !hasStats && (
              <p className="text-[13px] text-secondary">
                Statistics weren't recorded for this match.
              </p>
            )}
            {/* Every stat the API recorded, not just the four headline ones. */}
            {hasStats &&
              Object.keys(homeStats).map((key) => (
                <StatBar
                  key={key}
                  label={key}
                  homeValue={toNumber(homeStats[key])}
                  awayValue={toNumber(awayStats[key])}
                />
              ))}
          </div>
          <div className="w-full lg:w-[320px]">
            <PossessionCard
              home={{ name: match.home, logo: match.home_logo }}
              away={{ name: match.away, logo: match.away_logo }}
              homePercent={homePossession}
              awayPercent={awayPossession}
              error={sectionErrors.statistics}
            />
          </div>
        </div>
      )}

      {activeTab === 'Comments' && <MatchComments apiMatchId={matchId} />}

      {/* Live Fan Chat sits at the bottom of the page in the wireframe. It's
          hidden on the Comments tab so the same feed never renders twice. */}
      {activeTab !== 'Comments' && <MatchComments apiMatchId={matchId} variant="chat" />}
    </div>
  )
}
