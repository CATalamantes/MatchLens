import { useState } from 'react'
import MatchCard from '../components/MatchCard'
import ProbabilityBar from '../components/ProbabilityBar'
import StatBar from '../components/StatBar'
import { matches } from '../mocks/matches'

const TABS = [
  { label: 'Live', status: 'LIVE' },
  { label: 'Upcoming', status: 'UPCOMING' },
  { label: 'Results', status: 'FT' },
]

// Feeds the right-hand "Live Match Stats" panel — placeholder numbers,
// pending the real per-match statistics endpoint.
const liveStats = [
  { label: 'Shots on Target', homeValue: 7, awayValue: 3 },
  { label: 'Possession', homeValue: 58, awayValue: 42 },
  { label: 'Fouls', homeValue: 8, awayValue: 11 },
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
  const [activeTab, setActiveTab] = useState('Live')
  const activeStatus = TABS.find((tab) => tab.label === activeTab).status
  const filteredMatches = matches.filter((match) => match.status === activeStatus)
  const featuredLiveMatch = matches.find((match) => match.status === 'LIVE')

  return (
    <div className="flex gap-6 p-6">
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-white">Matches</h1>
          <p className="text-[13px] text-secondary">
            Live analytics and deep match insights across the FIFA World Cup 2026.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
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
          <div className="flex w-[280px] items-center gap-2 rounded-lg border border-dash bg-dash-card px-4 py-2">
            <SearchIcon className="size-3.5 shrink-0 text-secondary" />
            <p className="text-[13px] text-secondary">Filter match details...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match) => (
            <div key={match.id} className="flex flex-col gap-3">
              <MatchCard match={match} />
              <ProbabilityBar {...match.probability} />
            </div>
          ))}
        </div>
      </div>

      <aside className="flex w-[280px] shrink-0 flex-col gap-6 rounded-2xl border border-dash bg-dash-sidebar p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-dash-live" />
            <p className="text-[14px] font-bold text-white">Live Match Stats</p>
          </div>
          {featuredLiveMatch && (
            <p className="text-[12px] font-semibold text-primary">
              {featuredLiveMatch.home} vs {featuredLiveMatch.away}
            </p>
          )}
        </div>

        {featuredLiveMatch && (
          <>
            <div className="relative flex h-[100px] w-full flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br from-dash-card to-black p-3">
              <p className="text-[14px] font-bold text-white">{featuredLiveMatch.venue}</p>
              <p className="text-[10px] text-primary">Simulation model live updates</p>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-[12px] font-bold uppercase text-secondary">Live Analytics Feed</p>
              {liveStats.map((stat) => (
                <StatBar key={stat.label} {...stat} />
              ))}
            </div>
          </>
        )}

        <div className="h-px w-full bg-dash" />

        <div className="flex flex-col gap-1.5 rounded-lg border border-primary bg-primary/10 p-3">
          <p className="text-[12px] font-bold text-primary">⚡ Model Verdict</p>
          <p className="text-[11px] text-white">
            High confidence: Argentina likely to advance based on historical World Cup knockout performance.
          </p>
        </div>
      </aside>
    </div>
  )
}
