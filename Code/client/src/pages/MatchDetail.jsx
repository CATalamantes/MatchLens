import { useState } from 'react'
import { useParams } from 'react-router-dom'
import ProbabilityBar from '../components/ProbabilityBar'
import StatBar from '../components/StatBar'
import VideoPlayer from '../components/VideoPlayer'
import CommentThread from '../components/CommentThread'
import { getMockMatchDetail } from '../mocks/matchDetail'

const TABS = ['Overview', 'Lineup', 'Stats', 'Comments', 'Highlights']

const mockChatMessages = [
  { id: 1, author: 'MessiFanatic', time: '19:42', text: 'Argentina are running rings around them today!' },
  { id: 2, author: 'LesBleusForever', time: '19:44', text: "Don't count us out, Mbappé is on fire" },
  { id: 3, author: 'AlbicelesteArmy', time: '19:45', text: "Scaloni's tactics are world class, securing slip and slide" },
]

function eventIcon(type) {
  if (type === 'goal') return '⚽'
  if (type === 'yellow_card') return '🟨'
  return '🟥'
}

function PitchDot({ name, x, y, isHome }) {
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`size-4 rounded-full ${isHome ? 'bg-dash-live' : 'bg-dash-away'}`} />
      <p className="whitespace-nowrap text-[8px] text-white">{name}</p>
    </div>
  )
}

export default function MatchDetail() {
  const { matchId } = useParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const match = getMockMatchDetail(matchId)

  return (
    <div className="flex gap-6 p-6">
      <div className="flex flex-1 flex-col gap-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-dash-card to-black" />
          <div className="relative flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-secondary">{match.competition}</p>
              {match.status === 'LIVE' && (
                <span className="rounded border border-primary bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                  LIVE {match.minute}'
                </span>
              )}
            </div>
            <div className="flex items-center justify-between px-10">
              <div className="flex w-[180px] items-center gap-3">
                <p className="truncate text-[22px] font-extrabold text-white">{match.home}</p>
                <span className="size-4 shrink-0 rounded-full bg-dash-live" />
              </div>
              <div className="shrink-0 rounded-lg bg-dash-sidebar px-4 py-1.5">
                <p className="text-[32px] font-extrabold text-primary">
                  {match.home_score} - {match.away_score}
                </p>
              </div>
              <div className="flex w-[180px] items-center justify-end gap-3">
                <span className="size-4 shrink-0 rounded-full bg-dash-away" />
                <p className="truncate text-[22px] font-extrabold text-white">{match.away}</p>
              </div>
            </div>
            <ProbabilityBar {...match.probability} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-dash">
          {TABS.map((tab) => {
            const isActive = tab === activeTab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="flex flex-col items-center gap-1.5 pb-2"
              >
                <span className={`text-[14px] ${isActive ? 'font-bold text-primary' : 'font-medium text-secondary'}`}>
                  {tab}
                </span>
                <span className={`h-[3px] w-10 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[16px] font-bold text-white">⚡ Key Match Events</p>
            <div className="flex flex-col gap-3">
              {match.events.map((event) => (
                <div
                  key={`${event.minute}-${event.type}`}
                  className="flex items-center gap-3 rounded-lg border border-dash bg-dash-sidebar p-3"
                >
                  <p className="w-8 shrink-0 text-[12px] font-bold text-primary">{event.minute}'</p>
                  <span className="text-[14px]">{eventIcon(event.type)}</span>
                  <p className="text-[12px] text-white">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Lineup' && (
          <div className="flex gap-6 rounded-2xl border border-dash bg-dash-card p-5">
            <div className="flex w-64 shrink-0 flex-col gap-4">
              <p className="text-[16px] font-bold text-white">📋 Live Tactical Formations</p>
              <p className="text-[13px] text-white">
                {match.home}: {match.lineups.home.formation}
              </p>
              <p className="text-[13px] text-white">
                {match.away}: {match.lineups.away.formation}
              </p>
            </div>
            <div className="relative aspect-[340/200] flex-1 overflow-hidden rounded-lg border border-primary/20 bg-primary/5">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/20" />
              <div className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
              {match.lineups.home.players.map((player) => (
                <PitchDot key={player.name} {...player} isHome />
              ))}
              {match.lineups.away.players.map((player) => (
                <PitchDot key={player.name} {...player} isHome={false} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-dash bg-dash-card p-5">
              <p className="text-[16px] font-bold text-white">📊 Live Match Statistics</p>
              {match.stats.map((stat) => (
                <StatBar key={stat.label} {...stat} />
              ))}
            </div>
            <div className="flex w-[300px] shrink-0 flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
              <p className="text-[16px] font-bold text-white">⚽ Ball Possession</p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <p className="text-[28px] font-extrabold text-dash-live">{match.possession.home}%</p>
                  <p className="text-[16px] text-secondary">vs</p>
                  <p className="text-[28px] font-extrabold text-dash-away">{match.possession.away}%</p>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full">
                  <div className="h-full bg-dash-live" style={{ width: `${match.possession.home}%` }} />
                  <div className="h-full bg-dash-away" style={{ width: `${match.possession.away}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Comments' && <CommentThread />}

        {activeTab === 'Highlights' && <VideoPlayer title={`${match.home} vs ${match.away} — Highlights`} />}
      </div>

      {/* Right sidebar */}
      <aside className="flex w-[300px] shrink-0 flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-dash bg-dash-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-bold text-white">💬 Live Fan Chat</p>
            <p className="text-[11px] font-semibold text-primary">1,247 online</p>
          </div>
          <div className="flex flex-col gap-3">
            {mockChatMessages.map((message) => (
              <div key={message.id} className="flex gap-2">
                <div className="size-6 shrink-0 rounded-full bg-white/10" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-white">{message.author}</p>
                    <p className="text-[9px] text-secondary">{message.time}</p>
                  </div>
                  <p className="text-[11px] text-secondary">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-dash-sidebar p-2.5">
            <p className="text-[12px] text-secondary">Send message...</p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center justify-center rounded-lg bg-primary p-3.5 text-[13px] font-bold text-black"
        >
          PLACE WAGER
        </button>
      </aside>
    </div>
  )
}
