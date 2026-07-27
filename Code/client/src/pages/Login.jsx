import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Real endpoint (verified against the current server code, not guessed):
// POST /api/users/login, body { email, password }.
const API_URL = import.meta.env.VITE_API_URL ?? ''

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function AppleIcon({ className }) {
  return (
    <svg viewBox="0 0 18 18" fill="currentColor" className={className}>
      <path d="M13.1 9.5c0-2 1.6-2.9 1.7-3-.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.7-3.1 1.9-1.3 2.3-.3 5.7 1 7.6.6.9 1.3 1.9 2.3 1.9.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2-.1 0-2.2-.8-2.2-3.1z" />
      <path d="M11.4 3.3c.5-.6.9-1.5.8-2.3-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.4-.8 2.2.8.1 1.6-.4 2.1-1z" />
    </svg>
  )
}

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 18 18" className={className}>
      <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5.5v3.5h4.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.status === 401) {
        setError('Invalid email or password')
        return
      }
      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }
      navigate('/')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-dashboard">
      <div className="flex w-[600px] shrink-0 flex-col justify-between border-r border-dash px-16 py-16">
        <div className="flex items-center gap-2">
          <div className="size-8 shrink-0 rounded-full bg-primary" />
          <p className="text-[22px] font-extrabold text-white">
            Match<span className="text-primary">L</span>ens
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-7">
          <div className="flex flex-col gap-2">
            <p className="text-[32px] font-bold text-white">Welcome Back</p>
            <p className="text-[15px] text-secondary">Enter your details to access your dashboard</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[12px] font-semibold uppercase text-secondary">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-dash bg-dash-card px-4 py-3.5 text-[15px] text-white placeholder:text-secondary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[12px] font-semibold uppercase text-secondary">
                Password
              </label>
              <div className="flex w-full items-center justify-between rounded-lg border border-dash bg-dash-card px-4 py-3.5">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-[15px] text-white placeholder:text-secondary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="shrink-0 text-secondary"
                >
                  <EyeIcon className="size-5" />
                </button>
              </div>
              <div className="flex w-full justify-end">
                <p className="text-[13px] font-semibold text-primary">Forgot Password?</p>
              </div>
            </div>
          </div>

          {error && <p className="text-[13px] text-dash-live">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary py-4 text-[16px] font-bold text-dashboard disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-dash" />
            <p className="text-[11px] font-semibold text-secondary">OR CONTINUE WITH</p>
            <div className="h-px flex-1 bg-dash" />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2.5 rounded-lg border border-dash py-3.5 text-[14px] font-semibold text-white"
            >
              <AppleIcon className="size-[18px]" />
              Apple
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2.5 rounded-lg border border-dash py-3.5 text-[14px] font-semibold text-white"
            >
              <GoogleIcon className="size-[18px]" />
              Google
            </button>
          </div>

          <p className="text-center text-[14px] font-semibold text-secondary">
            Don&apos;t have an account? <span className="text-primary">Sign Up</span>
          </p>
        </form>

        <div className="flex flex-col items-center gap-2 text-center text-secondary">
          <p className="text-[13px]">Terms of Service · Privacy Policy · Help Center</p>
          <p className="text-[11px]">v2.4.0-Stable · Systems Operational</p>
        </div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-dash-card to-black" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="size-[120px] shrink-0 rounded-full bg-primary/10" />
          <p className="text-[36px] font-extrabold text-white">
            Match<span className="text-primary">L</span>ens
          </p>
          <p className="text-[16px] text-secondary">Your ultimate arena companion</p>
        </div>
      </div>
    </div>
  )
}
