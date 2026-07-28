import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSessionUser } from '../../hooks/useSessionUser'
import AuthAPI from '../../services/AuthAPI'
import Avatar from '../Avatar'
import Crest from '../Crest'
import Skeleton from '../Skeleton'
import ballMark from '../../assets/ball.png'

const API_URL = import.meta.env.VITE_API_URL ?? ''

const menuItems = [
  { label: 'Dashboard', to: '/', end: true, icon: DashboardIcon },
  { label: 'Live Football', to: '/matches', end: false, icon: LiveIcon },
  { label: 'Fan Leaderboard', to: '/leaderboard', end: false, icon: StandingsIcon },
  { label: 'Highlights', to: '/discover', end: false, icon: HighlightsIcon },
]

function DashboardIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function LiveIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function StandingsIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2.5 13.5v-4M8 13.5v-8M13.5 13.5v-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function HighlightsIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M4 2.5l9 5.5-9 5.5v-11z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={className}>
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5l-2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SignOutIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M6 2.5H3.5v11H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 5l3 3-3 3M12 8H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M8 1.5c-1.9 0-3.5 1.6-3.5 3.6v2.1c0 .5-.2 1-.6 1.4l-.7.7c-.3.3-.1.9.3.9h9c.4 0 .6-.6.3-.9l-.7-.7c-.4-.4-.6-.9-.6-1.4V5.1c0-2-1.6-3.6-3.5-3.6z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6.6 12.5a1.5 1.5 0 0 0 2.8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function timeAgo(dateString) {
  const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Sidebar() {
  const navigate = useNavigate()
  const user = useSessionUser()
  const [followedTeams, setFollowedTeams] = useState([])
  const [followsLoading, setFollowsLoading] = useState(true)
  const [followsError, setFollowsError] = useState(null)
  const [teamLogoById, setTeamLogoById] = useState({})
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setNotificationsLoading(false)
      return
    }
    setNotificationsLoading(true)
    setNotificationsError(null)
    fetch(`${API_URL}/api/notifications/user/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load notifications')
        return res.json()
      })
      .then(setNotifications)
      .catch((err) => {
        console.error('Failed to load notifications', err)
        setNotificationsError('Could not load notifications.')
      })
      .finally(() => setNotificationsLoading(false))
  }, [user?.id])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function handleMarkRead(notificationId) {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to mark notification read')
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n)),
      )
    } catch (err) {
      console.error('Failed to mark notification read', err)
    }
  }

  useEffect(() => {
    if (!user?.id) {
      setFollowsLoading(false)
      return
    }
    setFollowsLoading(true)
    setFollowsError(null)
    fetch(`${API_URL}/api/follows/user/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load followed teams')
        return res.json()
      })
      .then(setFollowedTeams)
      .catch((err) => {
        console.error('Failed to load followed teams', err)
        setFollowsError('Could not load followed teams.')
      })
      .finally(() => setFollowsLoading(false))
  }, [user?.id])

  // followed_teams only stores a name/id snapshot, not a crest — join
  // against the real team catalog so the sidebar can show real flags.
  useEffect(() => {
    fetch(`${API_URL}/api/teams`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const byId = {}
        for (const t of data) byId[String(t.id)] = t.logo
        setTeamLogoById(byId)
      })
      .catch((err) => console.error('Failed to load team crests', err))
  }, [])

  // AuthAPI.logout clears localStorage itself. The server also has to destroy
  // the session — clearing only localStorage left the cookie alive, so the next
  // visit picked the session back up and silently signed you in again.
  const handleSignOut = async () => {
    try {
      await AuthAPI.logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex h-screen bg-dashboard">
      <aside className="flex h-screen w-[220px] shrink-0 flex-col gap-7 border-r border-dash bg-dash-sidebar p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={ballMark} alt="" className="size-7 shrink-0" />
            <p className="whitespace-nowrap text-[18px] font-bold text-white">
              Match<span className="text-primary">L</span>ens
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative flex size-7 shrink-0 items-center justify-center rounded-md text-secondary hover:bg-white/5 hover:text-white"
            >
              <BellIcon className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-dash-live text-[8px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setShowNotifications(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute left-0 top-9 z-50 flex w-[280px] flex-col gap-1 rounded-xl border border-dash bg-dash-card p-2 shadow-lg">
                  <p className="px-2 py-1.5 text-[11px] font-bold uppercase text-secondary">Notifications</p>
                  {notificationsLoading && (
                    <p className="px-2 py-2 text-[12px] text-secondary">Loading…</p>
                  )}
                  {notificationsError && (
                    <p className="px-2 py-2 text-[12px] text-dash-live">{notificationsError}</p>
                  )}
                  {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                    <p className="px-2 py-2 text-[12px] text-secondary">No notifications yet.</p>
                  )}
                  {!notificationsLoading &&
                    !notificationsError &&
                    notifications.map((n) => (
                      <button
                        key={n.notification_id}
                        type="button"
                        onClick={() => handleMarkRead(n.notification_id)}
                        className={`flex flex-col gap-0.5 rounded-lg px-2 py-2 text-left ${
                          n.is_read ? 'opacity-50' : 'bg-white/5'
                        }`}
                      >
                        <p className="text-[12px] text-white">{n.message}</p>
                        <p className="text-[10px] text-secondary">{timeAgo(n.created_at)}</p>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-dash-input py-2 pl-3 pr-2">
          <SearchIcon className="size-3 shrink-0 text-secondary" />
          <input
            type="text"
            placeholder="Quick Search..."
            className="w-full bg-transparent text-[12px] text-secondary placeholder:text-secondary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase text-secondary">Menu</p>
          <div className="flex flex-col gap-1.5">
            {menuItems.map(({ label, to, end, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-secondary'
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                <p className="text-[13px] font-semibold">{label}</p>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <p className="text-[11px] font-bold uppercase text-secondary">Followed Teams</p>
          <div className="flex flex-col gap-2.5 overflow-y-auto">
            {followsLoading &&
              [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-5 shrink-0 rounded" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            {!followsLoading && followsError && (
              <p className="text-[12px] text-dash-live">{followsError}</p>
            )}
            {!followsLoading &&
              !followsError &&
              followedTeams.map((team) => (
                <Link
                  key={team.followed_team_id}
                  to={`/teams/${team.api_team_id}`}
                  className="flex items-center gap-3 text-secondary hover:text-white"
                >
                  <Crest
                    compact
                    label={team.team_name}
                    src={teamLogoById[team.api_team_id]}
                    className="size-5 shrink-0 rounded"
                  />
                  <p className="truncate text-[13px] font-medium text-white">{team.team_name}</p>
                </Link>
              ))}
            {!followsLoading && !followsError && followedTeams.length === 0 && (
              <p className="text-[12px] text-secondary">No teams followed yet.</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 ${
                isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Avatar
              name={user?.username}
              src={user?.profile_image_url}
              className="size-7 shrink-0 rounded-full"
              textClassName="text-[10px]"
            />
            <p className="truncate text-[13px] font-semibold">{user?.username ?? 'Profile'}</p>
          </NavLink>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-secondary hover:bg-white/5 hover:text-white"
          >
            <SignOutIcon className="size-4 shrink-0" />
            <p className="text-[13px] font-semibold">Sign Out</p>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-dashboard">
        <Outlet />
      </main>
    </div>
  )
}
