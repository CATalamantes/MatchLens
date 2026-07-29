import { useEffect, useState } from 'react'
import CommentsAPI from '../services/CommentsAPI'
import Avatar from './Avatar'

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

    const actionButton =
        'rounded border border-dash px-2 py-1 text-[11px] font-semibold text-secondary hover:border-primary hover:text-primary'

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-5">
            <div className="flex items-center justify-between">
                <p className="text-[16px] font-bold text-white">
                    💬 {variant === 'chat' ? 'Live Fan Chat' : 'Comments'}
                </p>
                <span className="text-[12px] text-secondary">
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                </span>
            </div>

            {error && <p className="text-[12px] text-dash-live">{error}</p>}

            <div className="flex flex-col gap-4">
                {comments.map((comment) => {
                    const author = comment.email.split('@')[0]
                    const isOwn = user && user.id === comment.user_id
                    const isEditing = editingId === comment.comment_id

                    return (
                        <div key={comment.comment_id} className="flex gap-3">
                            <Avatar name={author} className="size-8 shrink-0 rounded-full" textClassName="text-[10px]" />

                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[12px] font-bold text-primary">{author}</span>
                                    <span className="text-[11px] text-secondary">
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>

                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            className="w-full rounded-lg border border-dash bg-dash-input p-3 text-[13px] text-white outline-none focus:border-primary"
                                            rows={2}
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button type="button" className={actionButton} onClick={() => saveEdit(comment.comment_id)}>
                                                Save
                                            </button>
                                            <button type="button" className={actionButton} onClick={cancelEdit}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="break-words text-[13px] text-secondary">{comment.content}</p>
                                )}

                                {isOwn && !isEditing && (
                                    <div className="flex gap-2">
                                        <button type="button" className={actionButton} onClick={() => startEdit(comment)}>
                                            Edit
                                        </button>
                                        <button type="button" className={actionButton} onClick={() => handleDelete(comment.comment_id)}>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {comments.length === 0 && (
                    <p className="text-[13px] text-secondary">
                        No comments yet. Be the first to share your thoughts.
                    </p>
                )}
            </div>

            {user ? (
                <form className="flex items-center gap-3" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="flex-1 rounded-lg border border-dash bg-dash-input px-4 py-3 text-[13px] text-white outline-none placeholder:text-secondary focus:border-primary"
                        placeholder="Join the discussion..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <button
                        type="submit"
                        aria-label="Post comment"
                        className="rounded-lg bg-primary px-4 py-3 text-[13px] font-bold text-black"
                    >
                        ➤
                    </button>
                </form>
            ) : (
                <p className="text-[13px] text-secondary">Log in to join the discussion.</p>
            )}
        </section>
    )
}

export default MatchComments
