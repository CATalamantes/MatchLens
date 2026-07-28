import React, { useEffect, useState } from 'react'
import CommentsAPI from '../services/CommentsAPI'
import '../css/MatchComments.css'

const POLL_INTERVAL_MS = 7000

const currentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('matchlens_user'))
    } catch {
        return null
    }
}

const MatchComments = ({ apiMatchId, variant = 'list' }) => {
    const [comments, setComments] = useState([])
    const [content, setContent] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editContent, setEditContent] = useState('')
    const [error, setError] = useState(null)

    const user = currentUser()

    const fetchComments = async () => {
        try {
            const data = await CommentsAPI.getComments(apiMatchId)
            setComments(data)
        } catch (err) {
            setError(err.message)
        }
    }

    useEffect(() => {
        fetchComments()
        const intervalId = setInterval(fetchComments, POLL_INTERVAL_MS)
        return () => clearInterval(intervalId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiMatchId])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!content.trim()) return

        try {
            await CommentsAPI.createComment(user.id, apiMatchId, content)
            setContent('')
            fetchComments()
        } catch (err) {
            setError(err.message)
        }
    }

    const startEdit = (comment) => {
        setEditingId(comment.comment_id)
        setEditContent(comment.content)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditContent('')
    }

    const saveEdit = async (commentId) => {
        if (!editContent.trim()) return

        try {
            await CommentsAPI.updateComment(commentId, user.id, editContent)
            cancelEdit()
            fetchComments()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDelete = async (commentId) => {
        try {
            await CommentsAPI.deleteComment(commentId, user.id)
            fetchComments()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <section className={`match-comments match-comments--${variant}`}>
            <div className='match-comments-header'>
                <h3>
                    <span aria-hidden='true'>💬</span>{' '}
                    {variant === 'chat' ? 'Live Fan Chat' : 'Comments'}
                </h3>
                {variant === 'chat' && (
                    <span className='fans-active-badge'>{comments.length} comments</span>
                )}
            </div>

            { error && <p className='match-comments-error'>{error}</p> }

            <div className='match-comments-list'>
                {comments.map((comment) => (
                    <div key={comment.comment_id} className='comment-row'>
                        <span className='comment-avatar' aria-hidden='true'>👤</span>
                        <div className='comment-body'>
                            <div className='comment-meta'>
                                <span className='comment-author'>{comment.email.split('@')[0]}</span>
                                <span className='comment-timestamp'>
                                    {new Date(comment.created_at).toLocaleString()}
                                </span>
                            </div>

                            {editingId === comment.comment_id ? (
                                <div className='comment-edit-form'>
                                    <textarea
                                        className='comment-textarea'
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                    />
                                    <div className='comment-actions'>
                                        <button type='button' onClick={() => saveEdit(comment.comment_id)}>Save</button>
                                        <button type='button' onClick={cancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <p className='comment-content'>{comment.content}</p>
                            )}

                            {user && user.id === comment.user_id && editingId !== comment.comment_id && (
                                <div className='comment-actions'>
                                    <button type='button' onClick={() => startEdit(comment)}>Edit</button>
                                    <button type='button' onClick={() => handleDelete(comment.comment_id)}>Delete</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {comments.length === 0 && (
                    <p className='match-comments-empty'>No comments yet. Be the first to share your thoughts.</p>
                )}
            </div>

            {user ? (
                <form className='comment-form' onSubmit={handleSubmit}>
                    <input
                        type='text'
                        className='comment-input'
                        placeholder='Join the discussion...'
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <button type='submit' className='comment-submit' aria-label='Post comment'>➤</button>
                </form>
            ) : (
                <p className='match-comments-login-prompt'>Log in to join the discussion.</p>
            )}
        </section>
    )
}

export default MatchComments
