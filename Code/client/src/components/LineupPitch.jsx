import { useState } from 'react'

// Lineup Visualization — the starting XI laid out on a pitch.
//
// API-Football gives each player a `grid` of "row:col", where row 1 is the
// keeper and rows climb towards the opposition. That's enough to place players
// properly instead of listing them: group by row, then space each row evenly.

function buildRows(startXI) {
  const rows = new Map()
  for (const player of startXI) {
    // A player without a grid (rare, but it happens on older fixtures) would
    // otherwise crash the split — park them in row 1 rather than dropping them.
    const row = Number(player.grid?.split(':')[0]) || 1
    if (!rows.has(row)) rows.set(row, [])
    rows.get(row).push(player)
  }
  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, players]) => ({
      row,
      players: players.sort(
        (a, b) => Number(a.grid?.split(':')[1] ?? 0) - Number(b.grid?.split(':')[1] ?? 0),
      ),
    }))
}

function PlayerDot({ player }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-black">
        {player.number}
      </div>
      <span className="max-w-[64px] truncate text-[9px] font-semibold text-white">
        {/* Surnames only — full names don't fit under a 32px dot. */}
        {player.name.split(' ').slice(-1)[0]}
      </span>
    </div>
  )
}

export default function LineupPitch({ lineups, loading, error }) {
  // Both teams come back in one response; the badge doubles as the toggle
  // between them so the pitch can show either side.
  const [side, setSide] = useState(0)
  const team = lineups?.[side]

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-bold text-white">Lineup Visualization</p>
        {team && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-black">
              {team.formation}
            </span>
            {lineups.map((option, index) => (
              <button
                key={option.team_id}
                type="button"
                onClick={() => setSide(index)}
                className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                  index === side
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dash text-secondary'
                }`}
              >
                {option.team}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="text-[13px] text-secondary">Loading lineups…</p>}
      {error && <p className="text-[13px] text-dash-live">{error}</p>}
      {!loading && !error && !team && (
        <p className="text-[13px] text-secondary">No lineup available for this match.</p>
      )}

      {team && (
        <>
          <div className="relative flex min-h-[340px] flex-col-reverse justify-around gap-4 overflow-hidden rounded-xl bg-gradient-to-b from-[#153B1F] to-[#0C2413] p-4">
            {/* Halfway line + centre circle, purely decorative */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/20" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />

            {buildRows(team.startXI).map(({ row, players }) => (
              <div key={row} className="relative flex justify-around">
                {players.map((player) => (
                  <PlayerDot key={player.id ?? player.name} player={player} />
                ))}
              </div>
            ))}
          </div>

          {team.coach && (
            <p className="text-[12px] text-secondary">
              Coach: <span className="font-semibold text-white">{team.coach}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
