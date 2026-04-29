import { ArrowRight, Bell, LogOut, ShieldCheck, TicketCheck, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProfilePage() {
  const auth = useAuth()
  const [fullName, setFullName] = useState(auth.user?.full_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(auth.user?.avatar_url ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    try {
      await auth.updateProfile({ full_name: fullName.trim(), avatar_url: avatarUrl.trim() || null })
      setMessage('Profile updated.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!auth.user) return null

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <div className="profile-hero">
        <div className="profile-avatar-large">{avatarUrl ? <img src={avatarUrl} alt="" /> : <UserRound size={56} />}</div>
        <div>
          <p className="eyebrow">
            <UserRound size={18} strokeWidth={2.5} />
            Account settings
          </p>
          <h1 id="profile-title">{auth.user.full_name}</h1>
          <p className="hero-text">{auth.user.email} · {auth.user.role}</p>
        </div>
      </div>

      <div className="profile-grid">
        <form className="admin-card profile-form" onSubmit={onSubmit}>
          <h2>Profile details</h2>
          <label className="field">
            <span>Full name</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label className="field">
            <span>Avatar URL</span>
            <input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
          </label>
          {message && <p className="success-text">{message}</p>}
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save profile'}
            <span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </span>
          </button>
        </form>

        <aside className="admin-card profile-actions-card">
          <h2>Workspace</h2>
          <Link className="secondary-button" to="/tickets">
            <TicketCheck size={18} strokeWidth={2.5} />
            My Tickets
          </Link>
          <Link className="secondary-button" to="/notifications">
            <Bell size={18} strokeWidth={2.5} />
            Notifications
          </Link>
          {auth.isAdmin && (
            <Link className="primary-button" to="/admin">
              Open Admin
              <span>
                <ShieldCheck size={18} strokeWidth={2.5} />
              </span>
            </Link>
          )}
          <button className="secondary-button danger-button" type="button" onClick={auth.signOut}>
            <LogOut size={18} strokeWidth={2.5} />
            Sign out
          </button>
        </aside>
      </div>
    </section>
  )
}
