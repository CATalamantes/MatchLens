const handleResponse = async (response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Request failed')
  }
  return response.json()
}

const getComments = async (apiMatchId) => {
  const response = await fetch(`/api/comments?api_match_id=${encodeURIComponent(apiMatchId)}`)
  return handleResponse(response)
}

const createComment = async (userId, apiMatchId, content) => {
  const response = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, api_match_id: apiMatchId, content })
  })
  return handleResponse(response)
}

const updateComment = async (commentId, userId, content) => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content })
  })
  return handleResponse(response)
}

const deleteComment = async (commentId, userId) => {
  const response = await fetch(`/api/comments/${commentId}?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  })
  return handleResponse(response)
}

export default { getComments, createComment, updateComment, deleteComment }
