export default function ProbabilityBar({ home, draw, away }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-start justify-between whitespace-nowrap text-[11px] font-semibold">
        <p className="text-primary">{home}% Home</p>
        <p className="text-secondary">{draw}% Draw</p>
        <p className="text-white">{away}% Away</p>
      </div>
      <div className="flex h-1.5 w-full items-start gap-0.5 overflow-hidden rounded-full">
        <div className="h-full bg-primary" style={{ width: `${home}%` }} />
        <div className="h-full bg-dash-neutral" style={{ width: `${draw}%` }} />
        <div className="h-full bg-white" style={{ width: `${away}%` }} />
      </div>
    </div>
  )
}
