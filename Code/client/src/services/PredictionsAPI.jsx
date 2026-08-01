const handleResponse = async (response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Request failed')
  }
  return response.json()
}

const getByUser = async (userId) => {
  const response = await fetch(`/api/predictions/user/${encodeURIComponent(userId)}`)
  return handleResponse(response)
}

const createPrediction = async (userId, apiMatchId, predictedHomeScore, predictedAwayScore) => {
  const response = await fetch('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      api_match_id: apiMatchId,
      predicted_home_score: predictedHomeScore,
      predicted_away_score: predictedAwayScore
    })
  })
  return handleResponse(response)
}

// Settling scores every unsettled prediction on the match, not just the caller's.
const settleMatch = async (apiMatchId) => {
  const response = await fetch(`/api/predictions/settle/${encodeURIComponent(apiMatchId)}`, {
    method: 'POST'
  })
  return handleResponse(response)
}

export default { getByUser, createPrediction, settleMatch }
