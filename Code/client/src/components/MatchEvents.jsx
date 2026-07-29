// Match Events timeline — goals, cards and substitutions in match order.
// `homeId` decides which side of the tie an event belongs to so the reader can
// tell at a glance who it happened to.

const ICONS = {
  Goal: '⚽',
  Card: '🟨',
  subst: '🔄',
  Var: '📺',
}

function iconFor(event) {
  if (event.type === 'Card') return event.detail === 'Red Card' ? '🟥' : '🟨'
  return ICONS[event.type] ?? '•'
}

function labelFor(event) {
  // "Normal Goal" reads oddly on screen; everything else is already readable.
  if (event.detail === 'Normal Goal') return 'Goal'
  return event.detail
}

export default function MatchEvents({ events, loading, error, homeId }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-bold text-white">📋 Match Events</p>
        {events.length > 0 && (
          <span className="text-[11px] text-secondary">{events.length} events</span>
        )}
      </div>

      {loading && <p className="text-[13px] text-secondary">Loading events…</p>}
      {error && <p className="text-[13px] text-dash-live">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="text-[13px] text-secondary">No events recorded for this match.</p>
      )}

      {/* Capped and scrolled: a busy match runs to 35+ events, which otherwise
          stretched this card past 900px and pushed everything else off screen. */}
      <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1">
        {events.map((event, index) => (
          <div
            key={`${event.minute}-${event.player}-${index}`}
            // Home events sit against the accent rail, away against the plain
            // one — the quickest way to read "who did this happen to".
            className={`flex gap-3 border-l-2 pl-3 ${
              event.team_id === homeId ? 'border-primary' : 'border-dash'
            }`}
          >
            <span className="w-8 shrink-0 text-[13px] font-bold text-primary">
              {event.minute}'{event.extra ? `+${event.extra}` : ''}
            </span>
            <span className="shrink-0 text-[13px]" aria-hidden="true">
              {iconFor(event)}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-[13px] font-bold text-white">
                {event.player ?? event.team}
              </p>
              <p className="truncate text-[12px] text-secondary">
                {labelFor(event)}
                {event.assist ? ` · assist ${event.assist}` : ''}
                {` · ${event.team}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
