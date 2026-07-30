import { useState } from 'react'
import { paletteFor, shortLabel } from '../utilities/monogram'

// Renders a team badge. API-Football supplies a real crest URL for every team,
// so `logo` is the normal path; the deterministic initials badge stays as the
// fallback for teams without one and for images that fail to load (rather than
// leaving a broken-image icon on the page).
// `compact` hides the label for slots too small to render legible text.
export default function Crest({ label, logo, compact = false, className = '', textClassName = 'text-[11px]' }) {
  const safeLabel = label || '?'
  const [logoFailed, setLogoFailed] = useState(false)

  if (logo && !logoFailed) {
    return (
      <img
        src={logo}
        alt=""
        title={safeLabel}
        aria-hidden="true"
        onError={() => setLogoFailed(true)}
        className={`shrink-0 object-contain ${className}`}
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
