import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import '../css/Home.css'

// ── Dummy data ────────────────────────────────────────────────
const bracket = {
    leftSemis: [
        { top: { team: 'FRA', score: 2 }, bottom: { team: 'MAR', score: 0 } },
        { top: { team: 'ESP', score: 2 }, bottom: { team: 'BEL', score: 1 } }
    ],
    leftFinal: { top: { team: 'FRA', score: '14 Jul' }, bottom: { team: 'ESP', score: '—' } },
    final: { label: 'FINAL • 19 JUL', top: 'TBD', bottom: 'TBD' },
    rightFinal: { top: { team: 'NOR', score: 'Tomorrow' }, bottom: { team: 'ENG', score: '—' } },
    rightSemis: [
        { top: { team: 'NOR', score: 2 }, bottom: { team: 'BRA', score: 1 } },
        { top: { team: 'MEX', score: 2 }, bottom: { team: 'ENG', score: 3 } }
    ]
}

const followedTeams = [
    { pos: 1, team: 'Liverpool', badge: '🔴', p: 24, wdl: '17/3/4', gs: 55, pts: 54, form: [1, 1, 1, 1, 0] },
    { pos: 2, team: 'Arsenal', badge: '🔴', p: 24, wdl: '16/4/4', gs: 48, pts: 52, form: [1, 1, 1, 1, 1] },
    { pos: 3, team: 'Man City', badge: '🔵', p: 23, wdl: '15/6/2', gs: 56, pts: 51, form: [0, 0, 1, 0, 1] }
]

const topScorers = [
    { name: 'Erling Haaland', team: 'MANCHESTER CITY', goals: 21, avatar: '🟦' },
    { name: 'Mohamed Salah', team: 'LIVERPOOL FC', goals: 18, avatar: '🟥' }
]

const playerOfTheWeek = {
    name: 'Bukayo Saka',
    successRate: '88.4%',
    distance: '11.2km'
}

const leaderboard = {
    weeklyAllowance: '1,000',
    currentPoints: '24,580'
}
// ─────────────────────────────────────────────────────────────

const Matchup = ({ top, bottom }) => (
    <div className='bracket-match'>
        <div className='bracket-row'>
            <span>{top.team}</span>
            <span className='bracket-score'>{top.score}</span>
        </div>
        <div className='bracket-row'>
            <span>{bottom.team}</span>
            <span className='bracket-score'>{bottom.score}</span>
        </div>
    </div>
)

const Home = ({ title }) => {
    const navigate = useNavigate()
    document.title = title

    useEffect(() => {
        if (!localStorage.getItem('matchlens_user')) {
            navigate('/')
        }
    }, [navigate])

    return (
        <div className='home-page'>
            <Navigation />

            <main className='home-main'>
                <h2 className='home-section-title'>Tournament Path</h2>

                <section className='bracket-card'>
                    <div className='bracket'>
                        <div className='bracket-col'>
                            {bracket.leftSemis.map((m, i) => <Matchup key={i} {...m} />)}
                        </div>
                        <div className='bracket-col bracket-col-center'>
                            <Matchup {...bracket.leftFinal} />
                        </div>
                        <div className='bracket-col bracket-final-col'>
                            <div className='bracket-trophy'>🏆</div>
                            <div className='bracket-final'>
                                <span className='bracket-final-label'>{bracket.final.label}</span>
                                <span className='bracket-final-teams'>
                                    <strong>{bracket.final.top}</strong>
                                    <span className='bracket-vs'>VS</span>
                                    <strong>{bracket.final.bottom}</strong>
                                </span>
                            </div>
                        </div>
                        <div className='bracket-col bracket-col-center'>
                            <Matchup {...bracket.rightFinal} />
                        </div>
                        <div className='bracket-col'>
                            {bracket.rightSemis.map((m, i) => <Matchup key={i} {...m} />)}
                        </div>
                    </div>
                </section>

                <section className='leaderboard-card'>
                    <div className='leaderboard-copy'>
                        <h3>Fan Leaderboard Preview</h3>
                        <p>Your match predictions are paying off. You're currently in the top 5% of global fans this week.</p>
                    </div>
                    <div className='leaderboard-stat'>
                        <span className='leaderboard-stat-label'>WEEKLY ALLOWANCE</span>
                        <span className='leaderboard-stat-value'>{leaderboard.weeklyAllowance}</span>
                    </div>
                    <div className='leaderboard-stat'>
                        <span className='leaderboard-stat-label'>CURRENT POINTS</span>
                        <span className='leaderboard-stat-value leaderboard-points'>{leaderboard.currentPoints}</span>
                    </div>
                    <button className='leaderboard-btn'>ENTER LEADERBOARD</button>
                </section>

                <div className='home-grid'>
                    <section className='teams-section'>
                        <div className='teams-header'>
                            <h2 className='home-section-title'>Your Followed Teams</h2>
                            <span className='teams-filter'>PREMIER LEAGUE ⌄</span>
                        </div>
                        <div className='teams-card'>
                            <table className='teams-table'>
                                <thead>
                                    <tr>
                                        <th>POS</th>
                                        <th>TEAM</th>
                                        <th>P</th>
                                        <th>W/D/L</th>
                                        <th>GS</th>
                                        <th>PTS</th>
                                        <th>FORM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {followedTeams.map((team) => (
                                        <tr key={team.pos}>
                                            <td className='teams-pos'>{team.pos}</td>
                                            <td className='teams-name'>
                                                <span className='teams-badge'>{team.badge}</span> {team.team}
                                            </td>
                                            <td>{team.p}</td>
                                            <td>{team.wdl}</td>
                                            <td>{team.gs}</td>
                                            <td className='teams-pts'>{team.pts}</td>
                                            <td>
                                                <span className='teams-form'>
                                                    {team.form.map((won, i) => (
                                                        <span key={i} className={won ? 'form-dot win' : 'form-dot'} />
                                                    ))}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside className='home-aside'>
                        <section className='scorers-card'>
                            <h3>Top Scorers</h3>
                            {topScorers.map((player, index) => (
                                <div key={index} className='scorer-row'>
                                    <span className='scorer-avatar'>{player.avatar}</span>
                                    <span className='scorer-info'>
                                        <strong>{player.name}</strong>
                                        <small>{player.team}</small>
                                    </span>
                                    <span className='scorer-goals'>{player.goals}</span>
                                </div>
                            ))}
                        </section>

                        <section className='potw-card'>
                            <div className='potw-banner'>
                                <span className='potw-label'>PLAYER OF THE WEEK</span>
                                <span className='potw-name'>{playerOfTheWeek.name}</span>
                            </div>
                            <div className='potw-stats'>
                                <div className='potw-stat'>
                                    <span className='potw-stat-label'>SUCCESS RATE</span>
                                    <span className='potw-stat-value'>{playerOfTheWeek.successRate}</span>
                                </div>
                                <div className='potw-stat'>
                                    <span className='potw-stat-label'>DISTANCE / 90</span>
                                    <span className='potw-stat-value potw-distance'>{playerOfTheWeek.distance}</span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>

            <footer className='home-footer'>
                <span>© 2024 MatchLens. Precision Football Analytics.</span>
                <ul>
                    <li>Terms of Service</li>
                    <li>Privacy Policy</li>
                    <li>Data Sources</li>
                    <li>API Access</li>
                </ul>
            </footer>
        </div>
    )
}

export default Home
