import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import UsersAPI from '../services/UsersAPI'
import GitHubMark from '../components/GitHubMark'
import { validateSignup } from '../utilities/validateSignup'
import '../css/Login.css'

const Signup = ({ title, api_url }) => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const AUTH_URL = `${api_url}/auth`

    useEffect(() => {
        document.title = title
    }, [title])

    const handleSignUp = async (event) => {
        event.preventDefault()

        // Quick client-side check for instant feedback...
        const validationError = validateSignup(email, username, password, confirmPassword)
        if (validationError) {
            setError(validationError)
            return
        }

        // ...but the server owns uniqueness, so it has the final say.
        try {
            setLoading(true)
            const user = await UsersAPI.createUser({ username, email, password })
            localStorage.setItem('matchlens_user', JSON.stringify(user))
            navigate('/home')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='login-page'>
            <div className='login-brand'>
                <span className='login-brand-mark'>●</span>
                <span className='login-brand-name'>MatchLens</span>
            </div>

            <div className='login-card'>
                <h1>Create Account</h1>
                <p className='login-subtitle'>Join MatchLens and start tracking every match</p>

                <form onSubmit={handleSignUp} noValidate>
                    <label className='login-label' htmlFor='email'>Email Address</label>
                    <input
                        id='email'
                        type='email'
                        placeholder='name@example.com'
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null) }}
                    />

                    <label className='login-label' htmlFor='username'>Username</label>
                    <input
                        id='username'
                        type='text'
                        placeholder='your_username'
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(null) }}
                    />

                    <label className='login-label' htmlFor='password'>Password</label>
                    <input
                        id='password'
                        type='password'
                        placeholder='At least 8 characters'
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    />

                    <label className='login-label' htmlFor='confirm-password'>Confirm Password</label>
                    <input
                        id='confirm-password'
                        type='password'
                        placeholder='••••••••'
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                    />

                    { error && <p className='login-error'>{error}</p> }

                    <button type='submit' className='login-submit' disabled={loading}>
                        { loading ? 'Creating Account...' : 'Create Account' }
                    </button>
                </form>

                <div className='login-divider'>
                    <span>OR CONTINUE WITH</span>
                </div>

                <div className='login-oauth'>
                    <a href={`${AUTH_URL}/github`} className='login-oauth-btn'>
                        <GitHubMark /> GitHub
                    </a>
                </div>

                <p className='login-signup'>
                    Already have an account? <Link to='/'>Sign In</Link>
                </p>
            </div>

            <div className='login-links'>
                <span>Terms of Service</span>
                <span className='login-dot'>•</span>
                <span>Privacy Policy</span>
                <span className='login-dot'>•</span>
                <span>Help Center</span>
            </div>

            <footer className='login-footer'>
                <span>© 2024 MatchLens. Precision Football Analytics.</span>
                <span className='login-footer-right'>
                    v2.4.0-Stable
                    <span className='login-status'>● Systems Operational</span>
                </span>
            </footer>
        </div>
    )
}

export default Signup
