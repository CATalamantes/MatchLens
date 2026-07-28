import { paletteFor, shortLabel } from '../utilities/monogram'

// Drop-in replacement for the old `bg-white/10` crest blocks — pass the same
// size/shape classes via `className`. Renders the real crest when `src` is
// available (only `/api/teams` returns one so far); otherwise falls back to
// a deterministic initials badge, never an invented logo.
// `compact` hides the label for slots too small to render legible text.
export default function Crest({ label, src, compact = false, className = '', textClassName = 'text-[11px]' }) {
  const safeLabel = label || '?'

  if (src) {
    return (
      <img
        src={src}
        alt=""
        title={safeLabel}
        className={`shrink-0 bg-white object-contain ${className}`}
      />
    )
  }

  const palette = paletteFor(safeLabel)

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden font-extrabold uppercase ${palette.bg} ${palette.text} ${className}`}
      title={safeLabel}
      aria-hidden="true"
    >
      {!compact && <span className={`${textClassName} leading-none`}>{shortLabel(safeLabel)}</span>}
    </div>
  )
}
