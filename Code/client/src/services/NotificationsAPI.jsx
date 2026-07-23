const BASE_URL = '/api'

const NotificationsAPI = {
    getNotificationsByUser: async (userId) => {
        const res = await fetch(`${BASE_URL}/notifications/user/${userId}`)
        if (!res.ok) throw new Error('Failed to fetch notifications')
        return res.json()
    },

    markRead: async (id) => {
        const res = await fetch(`${BASE_URL}/notifications/${id}/read`, { method: 'PATCH' })
        if (!res.ok) throw new Error('Failed to mark notification read')
        return res.json()
    }
}

export default NotificationsAPI
