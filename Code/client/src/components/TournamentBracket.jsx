import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import Crest from './Crest'

// A real bracket: each round half the size of the last, joined by elbow
// connectors.
//
// The geometry works because every column — rounds AND connectors — is the same
// height and uses `justify-around`. With 2N matches spread that way their
// centres land at 1/4 and 3/4 of each connector slot, so a spine drawn from 25%
// to 75% with a stub at 50% lands exactly on the cards either side. No absolute
// pixel maths, and it holds at any height.
//
// `gap` is deliberately absent from the flex columns: gaps eat into the free
// space `justify-around` distributes, which would drift the lines off the cards.

const LINE = 'bg-secondary/40'

// Both column types start with a label row of identical height, so the
// connectors line up with the cards rather than the headings.
const LABEL_ROW = 'h-5 shrink-0'

function BracketMatch({ match }) {
  const side = (team, logo, score, won) => (
    <div className="flex items-center gap-2">
      <Crest label={team} logo={logo} className="size-4 rounded-full" compact />
      <span className={`flex-1 truncate ${won ? 'font-bold text-white' : 'text-secondary'}`}>
        {team}
      </span>
      <span className={won ? 'font-bold text-primary' : 'text-secondary'}>{score}</span>
    </div>
  )

  return (
    <Link
      to={`/matches/${match.id}`}
      className="flex w-[168px] flex-col gap-1 rounded-md border border-dash bg-dash-sidebar p-2 text-[11px] hover:border-primary"
    >
      {side(match.home, match.home_logo, match.home_score, match.home_winner)}
      {side(match.away, match.away_logo, match.away_score, match.away_winner)}
      {match.score_penalty?.home != null && (
        <p className="text-[9px] text-secondary">
          pens {match.score_penalty.home}–{match.score_penalty.away}
        </p>
      )}
    </Link>
  )
}

// One elbow per match in the round being fed into: two stubs in from the pair,
// a spine joining them, one stub out to the next round.
function Connectors({ count }) {
  return (
    <div className="flex w-8 shrink-0 flex-col">
      <div className={LABEL_ROW} />
      <div className="flex flex-1 flex-col justify-around">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="relative h-full w-full">
            <div className={`absolute left-1/2 top-1/4 h-1/2 w-px ${LINE}`} />
            <div className={`absolute left-0 top-1/4 h-px w-1/2 ${LINE}`} />
            <div className={`absolute left-0 top-3/4 h-px w-1/2 ${LINE}`} />
            <div className={`absolute left-1/2 top-1/2 h-px w-1/2 ${LINE}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TournamentBracket({ rounds }) {
  if (!rounds?.length) return null

  // Tall enough that eight Round-of-16 cards get breathing room once
  // justify-around spreads them.
  return (
    <div className="flex min-h-[560px] overflow-x-auto pb-2">
      {rounds.map((round, index) => (
        <Fragment key={round.round}>
          <div className="flex shrink-0 flex-col">
            <p className={`${LABEL_ROW} text-[10px] font-bold uppercase tracking-wide text-primary`}>
              {round.round}
            </p>
            <div className="flex flex-1 flex-col justify-around">
              {round.matches.map((match) => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </div>

          {index < rounds.length - 1 && (
            <Connectors count={rounds[index + 1].matches.length} />
          )}
        </Fragment>
      ))}
    </div>
  )
}
