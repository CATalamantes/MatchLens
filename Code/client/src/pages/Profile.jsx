import { useEffect, useState } from 'react'
import { teams as followableTeams } from '../mocks/teams'

// No login/session exists yet — stand-in for "the logged-in user" until
// real auth lands. Every real API call on this page targets this id.
const DEMO_USER_ID = 1

const API_URL = import.meta.env.VITE_API_URL ?? ''
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const BIO_STORAGE_KEY = `matchlens:bio:${DEMO_USER_ID}`
const DEFAULT_BIO = 'Tactical obsession. Data-driven insights. World Cup 2026 prediction specialist.'

// Decorative only — no transactions table or trend data exists anywhere
// (points-beyond-display is GildardoOrea's territory, #10).
const balanceTrend = [40, 55, 35, 60, 30, 70, 50]
const recentTransactions = [
  { label: 'Argentina vs Mexico ✅', amount: '+320 pts', positive: true },
  { label: 'France vs Germany ❌', amount: '-200 pts', positive: false },
  { label: 'Brazil vs Serbia ✅', amount: '+450 pts', positive: true },
]

const connectedApps = [
  { name: 'Twitter/X', connected: true },
  { name: 'Discord', connected: false },
  { name: 'Spotify', connected: false },
]

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-dash-mlx' : 'bg-dash-input'}`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [followedTeams, setFollowedTeams] = useState([])
  const [followError, setFollowError] = useState(null)
  const [showTeamPicker, setShowTeamPicker] = useState(false)

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [bio, setBio] = useState(() => localStorage.getItem(BIO_STORAGE_KEY) ?? DEFAULT_BIO)
  const [bioDraft, setBioDraft] = useState(bio)

  const [notifPrefs, setNotifPrefs] = useState({
    matchAlerts: true,
    transferNews: true,
    worldCupUpdates: true,
    leaderboardMilestones: false,
    predictionResults: true,
  })
  const [privacyPrefs, setPrivacyPrefs] = useState({
    profileVisibility: true,
    dataSharing: false,
    showPredictionHistory: true,
  })

  useEffect(() => {
    fetch(`${API_URL}/api/users/${DEMO_USER_ID}`)
      .then((res) => res.json())
      .then(setUser)
      .catch((err) => console.error('Failed to load user', err))

    fetch(`${API_URL}/api/follows/user/${DEMO_USER_ID}`)
      .then((res) => res.json())
      .then(setFollowedTeams)
      .catch((err) => console.error('Failed to load followed teams', err))
  }, [])

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setUploadError(
        'Cloudinary is not configured — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in client/.env',
      )
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      )
      if (!uploadRes.ok) throw new Error('Cloudinary upload failed')
      const uploadData = await uploadRes.json()

      // getUserById/updateUser never return profile_image_url (see plan
      // notes) — use the URL Cloudinary gave us directly instead of
      // trying to re-fetch it from the API.
      setAvatarUrl(uploadData.secure_url)

      await fetch(`${API_URL}/api/users/${DEMO_USER_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: uploadData.secure_url }),
      })
    } catch (err) {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleSaveBio() {
    setBio(bioDraft)
    localStorage.setItem(BIO_STORAGE_KEY, bioDraft)
    setIsEditingProfile(false)
  }

  async function handleFollowTeam(team) {
    setFollowError(null)
    try {
      const res = await fetch(`${API_URL}/api/follows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: DEMO_USER_ID, api_team_id: team.api_team_id, team_name: team.name }),
      })
      if (!res.ok) throw new Error('Follow failed')
      const created = await res.json()
      setFollowedTeams((prev) => [...prev, created])
      setShowTeamPicker(false)
    } catch (err) {
      setFollowError('Could not follow team. Please try again.')
    }
  }

  async function handleUnfollowTeam(followedTeamId) {
    setFollowError(null)
    try {
      const res = await fetch(`${API_URL}/api/follows/${followedTeamId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Unfollow failed')
      setFollowedTeams((prev) => prev.filter((team) => team.followed_team_id !== followedTeamId))
    } catch (err) {
      setFollowError('Could not unfollow team. Please try again.')
    }
  }

  const pickableTeams = followableTeams.filter(
    (team) => !followedTeams.some((followed) => String(followed.api_team_id) === String(team.api_team_id)),
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-white">Profile &amp; Account Settings</h1>
        <p className="text-[13px] text-secondary">
          Manage your predictive avatar, tracked national teams, and account safety.
        </p>
      </div>

      <div className="flex gap-6">
        <div className="flex flex-1 flex-col gap-6">
          {/* Profile header */}
          <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="size-16 shrink-0 rounded-full bg-white/10 bg-cover bg-center"
                  style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-[18px] font-bold text-white">{user?.username ?? 'Loading…'}</p>
                  <p className="text-[13px] text-secondary">@{user?.username ?? '...'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile((prev) => !prev)}
                className="rounded-lg border border-dash px-3 py-1.5 text-[12px] font-semibold text-white"
              >
                {isEditingProfile ? 'Close' : 'Edit Profile'}
              </button>
            </div>

            {isEditingProfile && (
              <div className="flex flex-col gap-3 rounded-lg border border-dash bg-dashboard p-4">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[12px] font-semibold text-secondary">Avatar</p>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-[12px] text-white" />
                  {uploading && <p className="text-[11px] text-secondary">Uploading…</p>}
                  {uploadError && <p className="text-[11px] text-dash-live">{uploadError}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[12px] font-semibold text-secondary">Bio</p>
                  <textarea
                    value={bioDraft}
                    onChange={(event) => setBioDraft(event.target.value)}
                    rows={3}
                    className="rounded-lg border border-dash bg-dash-card p-3 text-[13px] text-white focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveBio}
                  className="w-fit rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-black"
                >
                  Save Changes
                </button>
              </div>
            )}

            <p className="text-[13px] text-white">{bio}</p>
            <div className="flex items-center gap-4 text-[12px] text-secondary">
              <p>📍 London, UK</p>
              <p>Joined March 2024</p>
            </div>
          </div>

          {/* Points balance */}
          <div className="flex flex-col gap-5 rounded-2xl border border-dash bg-dash-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[12px] font-semibold text-secondary">Points Balance</p>
                <p className="text-[28px] font-extrabold text-dash-mlx">
                  {(user?.points ?? 0).toLocaleString()}
                </p>
              </div>
              <span className="rounded-lg bg-dash-mlx px-4 py-2 text-[12px] font-bold uppercase text-dash-sidebar">
                Top Up Balance
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-secondary">
                <p>Balance Trend (Last 30 days)</p>
              </div>
              <div className="flex h-10 items-end gap-1.5">
                {balanceTrend.map((height, index) => (
                  <div key={index} className="flex-1 rounded-t bg-dash-mlx/40" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-white">Recent Transactions</p>
              {recentTransactions.map((tx) => (
                <div key={tx.label} className="flex items-center justify-between text-[13px]">
                  <p className="text-white">{tx.label}</p>
                  <p className={tx.positive ? 'text-dash-mlx' : 'text-dash-live'}>{tx.amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Followed teams */}
          <div className="flex flex-col gap-4 rounded-2xl border border-dash bg-dash-card p-6">
            <p className="text-[18px] font-bold text-white">Followed Teams</p>
            {followError && <p className="text-[12px] text-dash-live">{followError}</p>}
            <div className="flex flex-col gap-3">
              {followedTeams.map((team) => (
                <div key={team.followed_team_id} className="flex items-center justify-between border-b border-dash pb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-6 shrink-0 rounded bg-white/10" />
                    <p className="text-[14px] font-bold text-white">{team.team_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnfollowTeam(team.followed_team_id)}
                    className="text-[12px] font-semibold text-dash-live"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
              {followedTeams.length === 0 && (
                <p className="text-[13px] text-secondary">Not following any teams yet.</p>
              )}
            </div>

            {showTeamPicker ? (
              <div className="flex flex-col gap-2">
                {pickableTeams.map((team) => (
                  <button
                    key={team.api_team_id}
                    type="button"
                    onClick={() => handleFollowTeam(team)}
                    className="flex items-center justify-between rounded-lg border border-dash bg-dashboard px-3 py-2 text-left text-[13px] text-white"
                  >
                    {team.name}
                    <span className="text-primary">+ Follow</span>
                  </button>
                ))}
                {pickableTeams.length === 0 && (
                  <p className="text-[12px] text-secondary">All available teams are already followed.</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTeamPicker(true)}
                className="w-fit text-[13px] font-semibold text-primary"
              >
                + Follow New Team
              </button>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex w-[420px] shrink-0 flex-col gap-6">
          <div className="flex flex-col gap-5 rounded-2xl border border-dash bg-dash-card p-6">
            <p className="text-[16px] font-bold text-white">Account Settings</p>

            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-semibold text-secondary">Notifications</p>
              {[
                ['matchAlerts', 'Match Alerts'],
                ['transferNews', 'Transfer News'],
                ['worldCupUpdates', 'World Cup 2026 Updates'],
                ['leaderboardMilestones', 'Leaderboard Milestones'],
                ['predictionResults', 'Prediction Results'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-[14px] text-white">{label}</p>
                  <ToggleSwitch
                    checked={notifPrefs[key]}
                    onChange={() => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))}
                  />
                </div>
              ))}
            </div>

            <div className="h-px w-full bg-dash" />

            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-semibold text-secondary">Privacy</p>
              {[
                ['profileVisibility', 'Profile Visibility'],
                ['dataSharing', 'Data Sharing'],
                ['showPredictionHistory', 'Show Prediction History'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-[14px] text-white">{label}</p>
                  <ToggleSwitch
                    checked={privacyPrefs[key]}
                    onChange={() => setPrivacyPrefs((prev) => ({ ...prev, [key]: !prev[key] }))}
                  />
                </div>
              ))}
            </div>

            <div className="h-px w-full bg-dash" />

            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-semibold text-secondary">Connected Apps</p>
              {connectedApps.map((app) => (
                <div key={app.name} className="flex items-center justify-between">
                  <p className="text-[14px] text-white">
                    {app.name} <span className="text-secondary">· {app.connected ? 'Connected ✓' : 'Not Connected'}</span>
                  </p>
                  <button
                    type="button"
                    className={`rounded-md px-3 py-1.5 text-[12px] font-semibold ${
                      app.connected ? 'text-dash-live' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {app.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-dash-live bg-dash-card p-5">
            <p className="text-[16px] font-bold text-dash-live">Danger Zone</p>
            <p className="text-[12px] text-secondary">
              This action cannot be undone. All your predictions, points balance, and leaderboard history will be
              permanently deleted.
            </p>
            <button
              type="button"
              className="rounded-lg border border-dash-live py-2.5 text-[13px] font-bold text-dash-live"
            >
              Deactivate Account
            </button>
            <button type="button" className="text-[13px] font-semibold text-dash-live underline">
              Delete Account Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
