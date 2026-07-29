import Crest from './Crest'

// Possession split. The bar alone was unreadable — you couldn't tell which
// side was which — so each team is named and crested against its own share.
export default function PossessionCard({ home, away, homePercent, awayPercent, loading, error }) {
  const hasData = homePercent != null && awayPercent != null

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
      <p className="text-[16px] font-bold text-white">Possession</p>

      {loading && <p className="text-[13px] text-secondary">Loading possession…</p>}
      {error && <p className="text-[13px] text-dash-live">{error}</p>}
      {!loading && !error && !hasData && (
        <p className="text-[13px] text-secondary">Possession wasn't recorded for this match.</p>
      )}

      {hasData && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Crest label={home?.name} logo={home?.logo} className="size-6 rounded-sm" compact />
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-[12px] font-semibold text-white">{home?.name}</p>
                <p className="text-[24px] font-extrabold leading-tight text-primary">{homePercent}%</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
              <div className="flex min-w-0 flex-col items-end">
                <p className="truncate text-[12px] font-semibold text-white">{away?.name}</p>
                <p className="text-[24px] font-extrabold leading-tight text-white">{awayPercent}%</p>
              </div>
              <Crest label={away?.name} logo={away?.logo} className="size-6 rounded-sm" compact />
            </div>
          </div>

          <div className="flex w-full gap-1">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${homePercent}%` }} />
            <div className="h-2 rounded-full bg-dash-input" style={{ width: `${awayPercent}%` }} />
          </div>

          <p className="text-[11px] text-secondary">
            {homePercent >= awayPercent ? home?.name : away?.name} kept the ball more of the match.
          </p>
        </>
      )}
    </div>
  )
}
