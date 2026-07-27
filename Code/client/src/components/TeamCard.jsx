export default function TeamCard({ team, isFollowing, onToggleFollow }) {
  return (
    <div className="flex w-[213px] shrink-0 flex-col gap-4 rounded-xl border border-dash bg-dash-card p-4">
      <div className="flex w-full items-start justify-center">
        <div className="size-16 shrink-0 rounded-full bg-white/10" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="w-full truncate text-[13px] font-bold text-white">{team.name}</p>
        <p className="w-full truncate text-[11px] font-semibold text-secondary">{team.region}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggleFollow(team.api_team_id)}
        className={`flex w-full items-center justify-center rounded-lg border-[1.5px] border-primary py-2 text-[11px] font-semibold ${
          isFollowing ? 'bg-primary/10 text-primary' : 'bg-transparent text-white'
        }`}
      >
        {isFollowing ? '✓ Following' : '+ Follow'}
      </button>
    </div>
  )
}
