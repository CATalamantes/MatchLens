import { Link } from 'react-router-dom'
import Avatar from './Avatar'

export default function PlayerCard({ player }) {
  const { id, name, photo, team, position, goals, assists } = player

  return (
    <Link
      to={`/players/${id}`}
      className="flex flex-col gap-3 rounded-xl border border-dash bg-dash-card p-4 hover:border-primary"
    >
      {/* `photo` has to be passed explicitly — without it Avatar silently falls
          back to initials, which is why every card showed "KM"/"LM". */}
      <Avatar
        name={name}
        src={photo}
        fit="contain"
        className="h-[130px] w-full rounded-lg bg-dash-sidebar"
        textClassName="text-[28px]"
      />
      <div className="flex flex-col gap-1">
        <p className="text-caption font-bold uppercase text-primary">{team}</p>
        <p className="text-body-lg font-bold text-white">{name}</p>
        <p className="line-clamp-2 text-caption text-secondary">
          {position} • {assists} assists
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-dash pt-2">
        <p className="text-caption text-secondary">Goals:</p>
        <p className="text-[16px] font-extrabold text-white">{goals}</p>
      </div>
    </Link>
  )
}
