import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Crest from '../components/Crest'
import Skeleton from '../components/Skeleton'
import { useSearch } from '../hooks/useSearch'
import { API_URL } from '../config/api'
import ballMark from '../assets/ball.png'

const SORTS = [
  { value: '', label: 'Relevance' },
  { value: 'goals', label: 'Most goals' },
  { value: 'assists', label: 'Most assists' },
  { value: 'age_desc', label: 'Oldest first' },
  { value: 'age_asc', label: 'Youngest first' },
  { value: 'name', label: 'Name (A–Z)' },
]

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 16l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SearchBar({ value, onChange, autoFocus, large }) {
  return (
    <div
      className={`flex w-full items-center gap-3 rounded-full border border-dash bg-dash-card focus-within:border-primary ${
        large ? 'px-6 py-4' : 'px-4 py-2.5'
      }`}
    >
      <SearchIcon className={`shrink-0 text-secondary ${large ? 'size-5' : 'size-4'}`} />
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search teams and players..."
        className={`w-full bg-transparent text-white placeholder:text-secondary focus:outline-none ${
          large ? 'text-[16px]' : 'text-[13px]'
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="shrink-0 text-[16px] leading-none text-secondary hover:text-white"
        >
          ×
        </button>
      )}
    </div>
  )
}

function FilterGroup({ title, children }) {
  return (
    <div className="flex flex-col gap-2 border-b border-dash pb-4 last:border-b-0">
      <p className="text-[11px] font-bold uppercase text-secondary">{title}</p>
      {children}
    </div>
  )
}

function FilterOption({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left text-[13px] ${active ? 'font-bold text-primary' : 'text-white hover:text-primary'}`}
    >
      {label}
    </button>
  )
}

function TeamResult({ team }) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="flex items-center gap-4 rounded-xl border border-dash bg-dash-card p-4 hover:border-primary"
    >
      <Crest label={team.name} logo={team.logo} className="size-14" textClassName="text-[16px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
            Team
          </span>
          <p className="truncate text-[15px] font-bold text-white">{team.name}</p>
        </div>
        <p className="text-[12px] text-secondary">
          {team.group} · {team.played} played · {team.wins}W {team.draws}D {team.losses}L
        </p>
        <p className="text-[12px] text-secondary">
          {team.goals_for} scored · {team.goals_against} conceded
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <p className="text-[20px] font-extrabold text-primary">{team.points}</p>
        <p className="text-[10px] uppercase text-secondary">pts</p>
      </div>
    </Link>
  )
}

function PlayerResult({ player }) {
  return (
    <Link
      to={`/players/${player.id}`}
      className="flex items-center gap-4 rounded-xl border border-dash bg-dash-card p-4 hover:border-primary"
    >
      <Avatar
        name={player.name}
        src={player.photo}
        fit="contain"
        className="size-14 shrink-0 rounded-lg bg-dash-sidebar"
        textClassName="text-[16px]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-dash-input px-1.5 py-0.5 text-[9px] font-bold uppercase text-secondary">
            Player
          </span>
          <p className="truncate text-[15px] font-bold text-white">{player.name}</p>
          {player.squad_number != null && (
            <span className="shrink-0 text-[11px] text-secondary">#{player.squad_number}</span>
          )}
        </div>
        <p className="truncate text-[12px] text-secondary">
          {[player.position, player.team_name, player.group].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[12px] text-secondary">
          {player.age ? `${player.age} yrs · ` : ''}
          {player.nationality}
        </p>
      </div>
      <div className="flex shrink-0 gap-5 text-right">
        <div className="flex flex-col">
          <p className="text-[16px] font-extrabold text-white">{player.assists}</p>
          <p className="text-[10px] uppercase text-secondary">assists</p>
        </div>
        <div className="flex flex-col">
          <p className="text-[16px] font-extrabold text-primary">{player.goals}</p>
          <p className="text-[10px] uppercase text-secondary">goals</p>
        </div>
      </div>
    </Link>
  )
}

export default function Discover() {
  const { query, filters, page, hasSearched, results, total, loading, error, update, clearAll } =
    useSearch()

  const [facets, setFacets] = useState({ groups: [], positions: [] })
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/search/facets`)
      .then((res) => (res.ok ? res.json() : { groups: [], positions: [] }))
      .then(setFacets)
      .catch(() => {})

    // A handful of crests under the search box, so the landing page isn't a
    // bare input with nothing to click.
    fetch(`${API_URL}/api/search?type=team&sort=points`)
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((body) => setFeatured((body.results ?? []).slice(0, 8)))
      .catch(() => {})
  }, [])

  // ── Landing ──────────────────────────────────────────────────────────
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center gap-8 px-6 py-20">
        <div className="flex items-center gap-3">
          <img src={ballMark} alt="" className="size-10 shrink-0" />
          <p className="text-[34px] font-extrabold text-white">
            Match<span className="text-primary">L</span>ens
          </p>
        </div>

        <p className="text-[13px] text-secondary">
          Search every team and player from the FIFA World Cup 2022
        </p>

        <div className="w-full max-w-[620px]">
          <SearchBar value={query} onChange={(value) => update({ q: value })} autoFocus large />
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-[11px] font-bold uppercase text-secondary">Browse teams</p>
          <div className="flex max-w-[620px] flex-wrap justify-center gap-3">
            {featured.length === 0
              ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="size-14 rounded-full" />
                ))
              : featured.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    title={team.name}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <Crest label={team.name} logo={team.logo} className="size-12" compact />
                    <span className="max-w-[72px] truncate text-[10px] text-secondary">
                      {team.name}
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────
  const activeFilterCount = [
    filters.type !== 'all' ? 1 : 0,
    filters.position ? 1 : 0,
    filters.group ? 1 : 0,
    filters.number ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="max-w-[720px]">
        <SearchBar value={query} onChange={(value) => update({ q: value })} />
      </div>

      <div className="flex gap-6">
        {/* Filter rail */}
        <aside className="hidden w-[210px] shrink-0 flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-4 lg:flex">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-white">Filters</p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-semibold text-primary"
              >
                Clear
              </button>
            )}
          </div>

          <FilterGroup title="Show">
            {[
              { value: 'all', label: 'Everything' },
              { value: 'team', label: 'Teams only' },
              { value: 'player', label: 'Players only' },
            ].map((option) => (
              <FilterOption
                key={option.value}
                label={option.label}
                active={filters.type === option.value}
                onClick={() => update({ type: option.value })}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Position">
            <FilterOption
              label="Any position"
              active={!filters.position}
              onClick={() => update({ position: '' })}
            />
            {facets.positions.map((position) => (
              <FilterOption
                key={position}
                label={position}
                active={filters.position === position}
                // Positions only exist on players, so picking one implies
                // narrowing to players rather than returning zero teams.
                onClick={() => update({ position, type: 'player' })}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Group">
            <FilterOption
              label="All groups"
              active={!filters.group}
              onClick={() => update({ group: '' })}
            />
            {facets.groups.map((group) => (
              <FilterOption
                key={group}
                label={group}
                active={filters.group === group}
                onClick={() => update({ group })}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Squad number">
            <input
              type="number"
              min="1"
              max="99"
              value={filters.number}
              onChange={(event) =>
                update({ number: event.target.value, type: event.target.value ? 'player' : filters.type })
              }
              placeholder="e.g. 10"
              className="w-full rounded-lg border border-dash bg-dash-input px-3 py-2 text-[13px] text-white placeholder:text-secondary focus:border-primary focus:outline-none"
            />
          </FilterGroup>
        </aside>

        {/* Results */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-secondary">
              {loading ? 'Searching…' : `${total} result${total === 1 ? '' : 's'}`}
              {query && !loading && <> for “<span className="text-white">{query}</span>”</>}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-[12px] text-secondary">
                Sort
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value })}
                className="rounded-lg border border-dash bg-dash-card px-3 py-2 text-[13px] text-white focus:border-primary focus:outline-none"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-[13px] text-dash-live">{error}</p>}

          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[86px] w-full rounded-xl" />
              ))}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-dash bg-dash-card p-6">
              <p className="text-[14px] font-bold text-white">No results</p>
              <p className="text-[13px] text-secondary">
                Nothing matched that search. Try a different name or clear your filters.
              </p>
            </div>
          )}

          {!loading &&
            results.map((item) =>
              item.type === 'team' ? (
                <TeamResult key={`team-${item.id}`} team={item} />
              ) : (
                <PlayerResult key={`player-${item.id}`} player={item} />
              ),
            )}

          {/* Pagination */}
          {!loading && total > results.length && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, { resetPage: false })}
                className="rounded-lg border border-dash px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[12px] text-secondary">Page {page}</span>
              <button
                type="button"
                disabled={page * 24 >= total}
                onClick={() => update({ page: String(page + 1) }, { resetPage: false })}
                className="rounded-lg border border-dash px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
