// OAuth lives on the API origin (port 3000), not behind the /api vite proxy,
// so these calls are cross-origin and must send the session cookie explicitly.
const AuthAPI = {
    // Returns the logged-in user, or null if this browser has no live session
    getSession: async (api_url) => {
        try {
            const res = await fetch(`${api_url}/auth/login/success`, {
                credentials: 'include'
            })
            if (!res.ok) return null
            const data = await res.json()
            return data.user ?? null
        } catch {
            return null
        }
    },

    logout: async (api_url) => {
        await fetch(`${api_url}/auth/logout`, { credentials: 'include' })
        localStorage.removeItem('matchlens_user')
    }
}

export default AuthAPI
