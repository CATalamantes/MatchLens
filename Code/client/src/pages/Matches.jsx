import { useEffect, useMemo, useState } from 'react'
import MatchCard from '../components/MatchCard'
import Crest from '../components/Crest'
import { API_URL } from '../config/api'

// A World Cup is organised by round, not by Live/Upcoming/Results — the old
// tabs filtered on status codes the API never emits, so two of the three were
// always empty. `match` receives the fixture's round string.
const TABS = [
  { label: 'All', match: () => true },
  { label: 'Group Stage', match: (round) => round.startsWith('Group Stage') },
  { label: 'Round of 16', match: (round) => round === 'Round of 16' },
  { label: 'Quarter-finals', match: (round) => round === 'Quarter-finals' },
  { label: 'Semi-finals', match: (round) => round === 'Semi-finals' },
  { label: 'Final', match: (round) => round === 'Final' || round === '3rd Place Final' },
]

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className}>
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.5 12.5l-3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/api/matches`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load matches')
        return res.json()
      })
      .then(setMatches)
      .catch((err) => {
        console.error('Failed to load matches', err)
        setError('Could not load matches. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [])

  const activeMatcher = TABS.find((tab) => tab.label === activeTab).match
  const filteredMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return matches
      .filter((match) => activeMatcher(match.round ?? ''))
      .filter((match) =>
        term === ''
          ? true
          : [match.home, match.away, match.venue].some((field) => field?.toLowerCase().includes(term)),
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [matches, activeMatcher, searchTerm])

  const finalMatch = matches.find((m) => m.round === 'Final')
  const champion = finalMatch?.home_winner
    ? { name: finalMatch.home, logo: finalMatch.home_logo }
    : finalMatch?.away_winner
      ? { name: finalMatch.away, logo: finalMatch.away_logo }
      : null

  return (
    <div className="flex gap-6 p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-white">Matches</h1>
          <p className="text-[13px] text-secondary">
            Every fixture from the FIFA World Cup 2022, with full stats and lineups.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            {TABS.map((tab) => {
              const isActive = tab.label === activeTab
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className={`text-[14px] ${isActive ? 'font-bold text-primary' : 'font-medium text-secondary'}`}>
                    {tab.label}
                  </span>
                  <span className={`h-[3px] w-6 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
                </button>
              )
            })}
          </div>

          <div className="flex w-[240px] items-center gap-2 rounded-lg border border-dash bg-dash-card px-4 py-2">
            <SearchIcon className="size-3.5 shrink-0 text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filter by team or venue..."
              className="w-full bg-transparent text-[13px] text-white placeholder:text-secondary focus:outline-none"
            />
          </div>
        </div>

        {loading && <p className="text-[13px] text-secondary">Loading matches…</p>}
        {error && <p className="text-[13px] text-dash-live">{error}</p>}

        {!loading && !error && filteredMatches.length === 0 && (
          <p className="text-[13px] text-secondary">No matches found for this filter.</p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>

      <aside className="flex w-[280px] shrink-0 flex-col gap-6 rounded-2xl border border-dash bg-dash-sidebar p-5">
        <p className="text-[14px] font-bold text-white">Tournament Summary</p>

        {champion ? (
          <div className="flex flex-col gap-3 rounded-lg border border-primary bg-primary/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Champions</p>
            <div className="flex items-center gap-3">
              <Crest label={champion.name} logo={champion.logo} className="size-10" />
              <p className="text-[16px] font-extrabold text-white">{champion.name}</p>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-secondary">Tournament result unavailable.</p>
        )}

        <div className="flex flex-col gap-2 rounded-lg border border-dash bg-dashboard p-3">
          <p className="text-[12px] font-bold uppercase text-secondary">Fixtures</p>
          <p className="text-[24px] font-extrabold text-primary">{matches.length}</p>
          <p className="text-[11px] text-secondary">
            Showing {filteredMatches.length} in {activeTab}
          </p>
        </div>

        {finalMatch && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-bold uppercase text-secondary">The Final</p>
            <MatchCard match={finalMatch} />
          </div>
        )}
      </aside>
    </div>
  )
}
