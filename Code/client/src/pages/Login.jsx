import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom'
import UsersAPI from '../services/UsersAPI'
import GitHubMark from '../components/GitHubMark'
import { AUTH_ORIGIN } from '../config/api'
import { validateLogin } from '../utilities/validateLogin'
import '../css/Login.css'

// The OAuth callback can only hand us a short code in the query string, so it
// redirects here with ?error=<code> rather than failing silently.
const OAUTH_ERRORS = {
    oauth_denied: 'Sign-in was cancelled.',
    oauth_failed: 'Something went wrong signing in with GitHub. Please try again.',
    account_conflict: 'That email is already registered to a different account. Try signing in with your password.'
}

const Login = ({ title }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const AUTH_URL = `${AUTH_ORIGIN}/auth`

    // Where RequireAuth turned this visitor away from, so signing in resumes
    // the page they actually asked for instead of always landing on the dashboard.
    const destination = location.state?.from?.pathname ?? '/'

    useEffect(() => {
        document.title = title
    }, [title])

    useEffect(() => {
        const code = searchParams.get('error')
        if (code) setError(OAUTH_ERRORS[code] ?? OAUTH_ERRORS.oauth_failed)
    }, [searchParams])

    const handleSignIn = async (event) => {
        event.preventDefault()

        // Quick client-side check for instant feedback...
        const validationError = validateLogin(email, password)
        if (validationError) {
            setError(validationError)
            return
        }

        // ...but the server has the final say on whether login succeeds.
        try {
            setLoading(true)
            const user = await UsersAPI.login(email, password)
            localStorage.setItem('matchlens_user', JSON.stringify(user))
            navigate(destination, { replace: true })
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
                <h1>Welcome Back</h1>
                <p className='login-subtitle'>Enter your details to access your dashboard</p>

                <form onSubmit={handleSignIn} noValidate>
                    <label className='login-label' htmlFor='email'>Email Address</label>
                    <input
                        id='email'
                        type='email'
                        placeholder='name@example.com'
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null) }}
                    />

                    <div className='login-password-row'>
                        <label className='login-label' htmlFor='password'>Password</label>
                        <a href='#' className='login-forgot' onClick={(e) => e.preventDefault()}>Forgot Password?</a>
                    </div>
                    <input
                        id='password'
                        type='password'
                        placeholder='••••••••'
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    />

                    { error && <p className='login-error'>{error}</p> }

                    <button type='submit' className='login-submit' disabled={loading}>
                        { loading ? 'Signing In...' : 'Sign In' }
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
                    Don't have an account? <Link to='/signup'>Sign Up</Link>
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

export default Login
