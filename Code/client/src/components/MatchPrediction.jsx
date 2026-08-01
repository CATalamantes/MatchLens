import { useEffect, useState } from 'react'
import PredictionsAPI from '../services/PredictionsAPI'

// These are the same finished match statuses used by the server.
// They determine whether the prediction form should remain open
// or whether the match is ready to be settled.
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN'])

const currentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('matchlens_user'))
    } catch {
        return null
    }
}

// Lets the user predict the final score and settle the prediction after the match.
// Keeping the logic here makes it easier for MatchDetail to include the feature.
const MatchPrediction = ({ match }) => {
    const user = currentUser()
    const apiMatchId = String(match.id)
    const finished = FINISHED_STATUSES.has(match.status)

    const [prediction, setPrediction] = useState(null)
    const [home, setHome] = useState('')
    const [away, setAway] = useState('')
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)
    const [busy, setBusy] = useState(false)

    const loadPrediction = async () => {
        if (!user) return
        try {
            const all = await PredictionsAPI.getByUser(user.id)
            setPrediction(all.find((p) => p.api_match_id === apiMatchId) ?? null)
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(() => {
        loadPrediction()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiMatchId])

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError(null)
        const h = parseInt(home)
        const a = parseInt(away)
        if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
            setError('Enter a whole number of goals for each team.')
            return
        }
        setBusy(true)
        try {
            const created = await PredictionsAPI.createPrediction(user.id, apiMatchId, h, a)
            setPrediction(created)
            setMessage('Prediction locked in. Good luck!')
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    const handleSettle = async () => {
        setError(null)
        setBusy(true)
        try {
            const result = await PredictionsAPI.settleMatch(apiMatchId)
            setMessage(`Settled ${result.settled_count} prediction(s) for this match.`)
            await loadPrediction()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    const label = 'text-[11px] font-bold uppercase tracking-wide text-secondary'
    const scoreInput =
        'w-16 rounded-lg border border-dash bg-dash-input px-3 py-2 text-center text-[16px] font-bold text-white outline-none focus:border-primary'

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
            <p className="text-[16px] font-bold text-white">🎯 Predict the Score</p>

            {error && <p className="text-[12px] text-dash-live">{error}</p>}
            {message && <p className="text-[12px] text-primary">{message}</p>}

            {!user && <p className="text-[13px] text-secondary">Log in to make a prediction.</p>}

            {/* Already predicted: show it, plus the outcome once settled. */}
            {user && prediction && (
                <div className="flex flex-col gap-1">
                    <span className={label}>Your prediction</span>
                    <p className="text-[18px] font-extrabold text-white">
                        {match.home} {prediction.predicted_home_score}
                        <span className="text-secondary"> – </span>
                        {prediction.predicted_away_score} {match.away}
                    </p>
                    {prediction.settled_at ? (
                        <p className="text-[13px] font-semibold text-primary">
                            +{prediction.points_awarded} pts
                        </p>
                    ) : (
                        <p className="text-[12px] text-secondary">
                            Pending — points are awarded when the match is settled.
                        </p>
                    )}
                </div>
            )}

            {/* No prediction yet and the match is still open: show the form. */}
            {user && !prediction && !finished && (
                <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1">
                        <span className={label}>{match.home}</span>
                        <input
                            type="number"
                            min="0"
                            className={scoreInput}
                            value={home}
                            onChange={(e) => setHome(e.target.value)}
                        />
                    </div>
                    <span className="pb-2 text-[16px] font-bold text-secondary">–</span>
                    <div className="flex flex-col gap-1">
                        <span className={label}>{match.away}</span>
                        <input
                            type="number"
                            min="0"
                            className={scoreInput}
                            value={away}
                            onChange={(e) => setAway(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-black disabled:opacity-50"
                    >
                        Submit Prediction
                    </button>
                </form>
            )}

            {/* No prediction and the match already ended, so it is too late to predict. */}
            {user && !prediction && finished && (
                <p className="text-[13px] text-secondary">
                    Predictions are closed — this match has finished.
                </p>
            )}

            {/* Settling is a manual action because there is no scheduler. It becomes
                available once the match is finished and scores every pending prediction. */}
            {finished && (
                <div className="flex flex-col gap-1 border-t border-dash pt-3">
                    <button
                        type="button"
                        onClick={handleSettle}
                        disabled={busy}
                        className="self-start rounded-lg border border-dash px-3 py-2 text-[12px] font-semibold text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                        ⚖️ Settle match
                    </button>
                    <span className="text-[11px] text-secondary">
                        Scores every pending prediction for this match and awards the points.
                    </span>
                </div>
            )}
        </section>
    )
}

export default MatchPrediction
