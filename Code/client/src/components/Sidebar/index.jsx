import { NavLink, Outlet } from 'react-router-dom'
import { followedTeams } from '../../mocks/followedTeams'

const menuItems = [
  { label: 'Dashboard', to: '/', end: true, icon: DashboardIcon },
  { label: 'Live Football', to: '/matches', end: false, icon: LiveIcon },
  { label: 'Standings', to: '/leaderboard', end: false, icon: StandingsIcon },
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

export default function Sidebar() {
  return (
    <div className="flex min-h-screen bg-dashboard">
      <aside className="flex w-[220px] shrink-0 flex-col gap-7 border-r border-dash bg-dash-sidebar p-5">
        <div className="flex items-center gap-2">
          <div className="size-7 shrink-0 rounded-full bg-primary" />
          <p className="whitespace-nowrap text-[18px] font-bold text-white">
            Match<span className="text-primary">L</span>ens
          </p>
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

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase text-secondary">Followed Teams</p>
          <div className="flex flex-col gap-2.5">
            {followedTeams.map((team) => (
              <div key={team.api_team_id} className="flex items-center gap-3">
                <div className="size-5 shrink-0 rounded bg-white/10" />
                <p className="text-[13px] font-medium text-white">{team.team_name}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-dashboard">
        <Outlet />
      </main>
    </div>
  )
}
