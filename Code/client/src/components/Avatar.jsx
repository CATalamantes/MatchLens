import { getInitials, paletteFor } from '../utilities/monogram'

// Drop-in replacement for the old `bg-white/10` avatar/photo blocks. Renders
// the real image when a URL is available (e.g. `profile_image_url`);
// otherwise falls back to a deterministic initials badge instead of a blank
// grey block — used for user avatars and player photos alike, since neither
// has a guaranteed image source.
// `fit` is 'cover' for round profile avatars and 'contain' for player
// headshots — API-Football portraits are near-square, so cover crops them
// through the face when the slot is wide.
export default function Avatar({ name, src, fit = 'cover', className = '', textClassName = 'text-[13px]' }) {
  const safeName = name || '?'

  if (src) {
    return (
      <div
        className={`${fit === 'contain' ? 'bg-contain bg-no-repeat' : 'bg-cover'} bg-center ${className}`}
        style={{ backgroundImage: `url(${src})` }}
        role="img"
        aria-label={safeName}
      />
    )
  }

  const palette = paletteFor(safeName)

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden font-bold uppercase ${palette.bg} ${palette.text} ${className}`}
      title={safeName}
      aria-hidden="true"
    >
      <span className={`${textClassName} leading-none`}>{getInitials(safeName)}</span>
    </div>
  )
}
