import React from 'react'
import assets from '../assets/assets'
import { apiFetch } from '../lib/api'

function ProfilePage() {
  const [profile, setProfile] = React.useState(null)
  const [form, setForm] = React.useState({
    displayName: '',
    bio: '',
    avatarKey: ''
  })
  const [saving, setSaving] = React.useState(false)
  const [status, setStatus] = React.useState('')

  React.useEffect(() => {
    const cached = localStorage.getItem('qc_user')
    if (!cached) return
    const parsed = JSON.parse(cached)
    setProfile(parsed)
    setForm({
      displayName: parsed.displayName || '',
      bio: parsed.bio || '',
      avatarKey: parsed.avatarKey || ''
    })
  }, [])

  const avatarMap = {
    profile_martin: assets.profile_martin,
    profile_alison: assets.profile_alison,
    profile_enrique: assets.profile_enrique,
    profile_marco: assets.profile_marco,
    profile_richard: assets.profile_richard
  }

  const avatarSrc = avatarMap[form.avatarKey] || assets.avatar_icon

  const handleSave = async () => {
    if (!profile?.id) return
    if (!form.displayName.trim()) {
      setStatus('Full name is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const updated = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: profile.id,
          displayName: form.displayName,
          bio: form.bio,
          avatarKey: form.avatarKey || null
        })
      })

      localStorage.setItem('qc_user', JSON.stringify(updated))
      setProfile(updated)
      setForm({
        displayName: updated.displayName || '',
        bio: updated.bio || '',
        avatarKey: updated.avatarKey || ''
      })
      setStatus('Profile updated.')
    } catch {
      setStatus('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0f1024]/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] text-white overflow-hidden">
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Edit Profile</h1>
            <p className="text-sm text-white/60">Keep your profile fresh and unique.</p>
          </div>
          <img src={assets.logo_icon} alt="QuickChat" className="w-10" />
        </div>

        <div className="p-8 grid gap-8 md:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img src={avatarSrc} alt="Profile" className="w-32 h-32 rounded-full object-cover border border-white/20" />
              <label className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-violet-500/90 flex items-center justify-center shadow-lg">
                <img src={assets.gallery_icon} alt="Upload" className="w-5" />
              </label>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{form.displayName || 'Guest User'}</p>
              <p className="text-sm text-white/60">Set your profile picture from presets below</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(avatarMap).map(([key, src]) => (
                <button
                  key={key}
                  className={`p-1 rounded-lg border ${form.avatarKey === key ? 'border-violet-400' : 'border-white/15'}`}
                  onClick={() => setForm((prev) => ({ ...prev, avatarKey: key }))}
                >
                  <img src={src} alt={key} className="w-14 h-14 rounded-full object-cover" />
                </button>
              ))}
              <button
                className={`p-1 rounded-lg border ${!form.avatarKey ? 'border-violet-400' : 'border-white/15'}`}
                onClick={() => setForm((prev) => ({ ...prev, avatarKey: '' }))}
              >
                <img src={assets.avatar_icon} alt="No avatar" className="w-14 h-14 rounded-full object-cover" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/60">Full Name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Status</label>
              <input
                type="text"
                defaultValue="Available for new chats"
                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Bio</label>
              <textarea
                rows="4"
                value={form.bio}
                onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/70 resize-none"
              />
            </div>
            {status ? <p className="text-xs text-white/70">{status}</p> : null}
            <button
              className="w-full rounded-2xl bg-violet-500/90 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
