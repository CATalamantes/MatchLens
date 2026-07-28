import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navigation from '../components/Navigation'
import MatchComments from '../components/MatchComments'
import '../css/MatchDetail.css'

// ── Dummy data (placeholder until the external match-data API is wired up) ──
const matchInfo = {
    competition: 'Premier League',
    homeTeam: { name: 'Arsenal', badge: '🔴', score: 2 },
    awayTeam: { name: 'Chelsea', badge: '🔵', score: 1 },
    minute: "74'",
    isLive: true,
    winProbability: { home: 64, away: 36 }
}

const matchEvents = [
    { minute: 24, type: 'goal', team: 'home', player: 'Bukayo Saka', note: 'Arsenal 1 - 0 Chelsea' },
    { minute: 41, type: 'yellow-card', team: 'away', player: 'Enzo Fernández', note: 'Yellow Card' },
    { minute: 56, type: 'goal', team: 'home', player: 'Gabriel Martinelli', note: 'Arsenal 2 - 0 Chelsea' },
    { minute: 68, type: 'goal', team: 'away', player: 'Cole Palmer', note: 'Arsenal 2 - 1 Chelsea' }
]

const lineupFormation = '4-3-3'
const lineup = [
    { number: 29, name: 'Havertz', x: 50, y: 12 },
    { number: 41, name: 'Rice', x: 50, y: 42 },
    { number: 4, name: 'White', x: 22, y: 68 },
    { number: 2, name: 'Saliba', x: 50, y: 72 },
    { number: 22, name: 'Raya', x: 50, y: 92 }
]

const keyStats = [
    { label: 'Shots', home: 12, away: 8 },
    { label: 'Shots on Target', home: 5, away: 3 },
    { label: 'Pass Accuracy', home: 88, away: 82 },
    { label: 'Fouls', home: 14, away: 11 }
]

const possession = { home: 58, away: 42 }

const highlight = { title: "Bukayo Saka's Clinical Opener", tag: "24' GOAL" }

const tabs = ['Overview', 'Lineup', 'Stats', 'Comments', 'Highlights']
// ─────────────────────────────────────────────────────────────────────────

const StatBar = ({ label, home, away }) => (
    <div className='stat-bar-row'>
        <span className='stat-value'>{home}</span>
        <div className='stat-bar-track'>
            <span className='stat-label'>{label}</span>
            <div className='stat-bar' style={{ '--home': `${(home / (home + away)) * 100}%` }} />
        </div>
        <span className='stat-value stat-value-away'>{away}</span>
    </div>
)

const MatchDetail = ({ title }) => {
    const navigate = useNavigate()
    const { apiMatchId } = useParams()
    const [activeTab, setActiveTab] = useState('Overview')

    document.title = title

    useEffect(() => {
        if (!localStorage.getItem('matchlens_user')) {
            navigate('/')
        }
    }, [navigate])

    return (
        <div className='match-page'>
            <Navigation />

            <main className='match-main'>
                <div className='match-breadcrumb'>
                    Matches <span>&gt;</span> {matchInfo.homeTeam.name} vs {matchInfo.awayTeam.name}
                </div>

                <section className='match-hero-card'>
                    <div className='winprob-bar'>
                        <span className='winprob-home' style={{ width: `${matchInfo.winProbability.home}%` }}>
                            WIN PROBABILITY {matchInfo.winProbability.home}%
                        </span>
                        <span className='winprob-away' style={{ width: `${matchInfo.winProbability.away}%` }}>
                            {matchInfo.winProbability.away}% WIN PROBABILITY
                        </span>
                    </div>

                    <div className='match-scoreboard'>
                        <div className='match-team'>
                            <div className='match-team-badge'>{matchInfo.homeTeam.badge}</div>
                            <h2>{matchInfo.homeTeam.name}</h2>
                            <span className='match-team-tag'>Home</span>
                        </div>

                        <div className='match-score-center'>
                            {matchInfo.isLive && <span className='match-live-tag'>● LIVE {matchInfo.minute}</span>}
                            <div className='match-score'>
                                {matchInfo.homeTeam.score} <span>:</span> {matchInfo.awayTeam.score}
                            </div>
                            <span className='match-competition'>{matchInfo.competition}</span>
                            <button type='button' className='match-wager-btn' disabled title='Coming soon'>
                                PLACE WAGER
                            </button>
                        </div>

                        <div className='match-team'>
                            <div className='match-team-badge'>{matchInfo.awayTeam.badge}</div>
                            <h2>{matchInfo.awayTeam.name}</h2>
                            <span className='match-team-tag'>Away</span>
                        </div>
                    </div>
                </section>

                <nav className='match-tabs'>
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type='button'
                            className={activeTab === tab ? 'match-tab active' : 'match-tab'}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </nav>

                {activeTab === 'Overview' && (
                    <>
                        <div className='match-overview-grid'>
                            <section className='match-card'>
                                <h3>📋 Match Events</h3>
                                <div className='events-list'>
                                    {matchEvents.map((event, i) => (
                                        <div key={i} className='event-row'>
                                            <span className='event-minute'>{event.minute}'</span>
                                            <div>
                                                <div className='event-title'>
                                                    {event.type === 'goal' ? '⚽' : '🟨'} {event.player}
                                                </div>
                                                <div className='event-note'>{event.note}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className='possession-card'>
                                    <h3>Possession</h3>
                                    <div className='possession-values'>
                                        <span>{possession.home}%</span>
                                        <span>{possession.away}%</span>
                                    </div>
                                    <div className='possession-bar'>
                                        <span style={{ width: `${possession.home}%` }} />
                                    </div>
                                </div>
                            </section>

                            <section className='match-card'>
                                <div className='lineup-header'>
                                    <h3>Lineup Visualization</h3>
                                    <span className='lineup-tag'>{lineupFormation}</span>
                                </div>
                                <div className='pitch'>
                                    {lineup.map((player) => (
                                        <div
                                            key={player.number}
                                            className='player-dot'
                                            style={{ left: `${player.x}%`, top: `${player.y}%` }}
                                        >
                                            <span>{player.number}</span>
                                            <small>{player.name}</small>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <aside className='match-aside'>
                                <section className='match-card'>
                                    <h3>Key Stats</h3>
                                    {keyStats.map((stat) => (
                                        <StatBar key={stat.label} {...stat} />
                                    ))}
                                </section>

                                <section className='match-card highlight-card'>
                                    <div className='highlight-thumb'>▶</div>
                                    <span className='highlight-tag'>{highlight.tag}</span>
                                    <p>{highlight.title}</p>
                                </section>
                            </aside>
                        </div>

                        <MatchComments apiMatchId={apiMatchId} variant='chat' />
                    </>
                )}

                {activeTab === 'Lineup' && (
                    <section className='match-card match-placeholder'>
                        Full lineup breakdown coming soon — this will use live data once the match API is integrated.
                    </section>
                )}

                {activeTab === 'Stats' && (
                    <section className='match-card match-placeholder'>
                        Full stats breakdown coming soon — this will use live data once the match API is integrated.
                    </section>
                )}

                {activeTab === 'Comments' && (
                    <MatchComments apiMatchId={apiMatchId} variant='list' />
                )}

                {activeTab === 'Highlights' && (
                    <section className='match-card match-placeholder'>
                        Video highlights coming soon — this will use live data once the match API is integrated.
                    </section>
                )}
            </main>
        </div>
    )
}

export default MatchDetail
