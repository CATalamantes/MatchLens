import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthAPI from '../services/AuthAPI'
import '../css/Navigation.css'

const liveScores = [
    { home: 'MCI', hs: 2, away: 'LIV', as: 1, time: "72'" },
    { home: 'RMA', hs: 0, away: 'FCB', as: 0, time: 'HT' },
    { home: 'PSG', hs: 3, away: 'BAY', as: 2, time: "88'" }
]

const Navigation = ({ api_url }) => {
    const navigate = useNavigate()

    // AuthAPI.logout clears localStorage itself. The server also has to destroy
    // the session — clearing only localStorage left the cookie alive, so the
    // next visit to /home picked the session back up and silently signed you in.
    const handleSignOut = async () => {
        try {
            await AuthAPI.logout(api_url)
        } finally {
            navigate('/')
        }
    }

    return (
        <header className='ml-header'>
            <nav className='ml-nav'>
                <div className='ml-nav-left'>
                    <Link to='/home' className='ml-logo'>MatchLens</Link>
                    <ul className='ml-nav-links'>
                        <li><Link to='/home' className='active'>Home</Link></li>
                        <li><a href='#' onClick={(e) => e.preventDefault()}>Matches</a></li>
                        <li><a href='#' onClick={(e) => e.preventDefault()}>Players &amp; Teams</a></li>
                        <li><a href='#' onClick={(e) => e.preventDefault()}>Fan Leaderboard</a></li>
                    </ul>
                </div>
                <div className='ml-nav-right'>
                    <input type='search' placeholder='Search matches...' className='ml-search' />
                    <button className='ml-icon-btn' title='Notifications'>🔔</button>
                    <button className='ml-icon-btn' title='Sign out' onClick={handleSignOut}>👤</button>
                </div>
            </nav>

            <div className='ml-ticker'>
                {liveScores.map((match, index) => (
                    <span key={index} className='ml-ticker-item'>
                        <span className='ml-live-dot'>●</span>
                        <span className='ml-live-label'>LIVE</span>
                        <span className='ml-ticker-teams'>
                            {match.home} <strong>{match.hs} - {match.as}</strong> {match.away}
                        </span>
                        <span className='ml-ticker-time'>{match.time}</span>
                    </span>
                ))}
            </div>
        </header>
    )
}

export default Navigation
