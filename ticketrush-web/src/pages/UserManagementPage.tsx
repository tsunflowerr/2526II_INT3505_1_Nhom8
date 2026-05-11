import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  ApiError,
  createUserByAdmin,
  deleteUserByAdmin,
  listUsers,
  updateUserByAdmin,
  type User,
} from '../services/userApi'

type ModalMode = 'create' | 'edit' | null
type RoleValue = 'USER' | 'ADMIN'
type StatusValue = 'ACTIVE' | 'BLOCKED'

export function UserManagementPage() {
  const auth = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<RoleValue>('USER')
  const [formStatus, setFormStatus] = useState<StatusValue>('ACTIVE')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!auth.tokens?.access_token) {
        setIsLoading(false)
        return
      }
      try {
        const fetched = await listUsers(auth.tokens.access_token)
        if (!cancelled) setUsers(fetched)
      } catch (err) {
        if (!cancelled) {
          setNotice({ tone: 'error', text: getErrorMessage(err, 'Unable to load users.') })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [auth.tokens?.access_token])

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return users
    return users.filter((user) =>
      [user.full_name, user.email ?? '', user.role, user.status, user.provider].join(' ').toLowerCase().includes(keyword),
    )
  }, [users, query])

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === 'ACTIVE').length,
      blocked: users.filter((user) => user.status === 'BLOCKED').length,
      admins: users.filter((user) => user.role === 'ADMIN').length,
    }),
    [users],
  )

  function openCreateModal() {
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('USER')
    setFormStatus('ACTIVE')
    setEditingUser(null)
    setModalMode('create')
  }

  function openEditModal(user: User) {
    setFormName(user.full_name)
    setFormEmail(user.email ?? '')
    setFormPassword('')
    setFormRole((user.role === 'ADMIN' ? 'ADMIN' : 'USER') as RoleValue)
    setFormStatus((user.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE') as StatusValue)
    setEditingUser(user)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setEditingUser(null)
    setIsSubmitting(false)
  }

  async function refreshUsers() {
    if (!auth.tokens?.access_token) return
    const fetched = await listUsers(auth.tokens.access_token)
    setUsers(fetched)
  }

  async function onSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.tokens?.access_token || !modalMode) return

    setIsSubmitting(true)
    setNotice(null)
    try {
      if (modalMode === 'create') {
        const created = await createUserByAdmin(auth.tokens.access_token, {
          email: formEmail.trim(),
          password: formPassword,
          full_name: formName.trim(),
          role: formRole,
          status: formStatus,
        })
        setUsers((current) => [created, ...current])
        setNotice({ tone: 'success', text: `User "${created.full_name}" created successfully.` })
      } else if (editingUser) {
        const updated = await updateUserByAdmin(auth.tokens.access_token, editingUser.id, {
          full_name: formName.trim(),
          role: formRole,
          status: formStatus,
        })
        setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)))
        setNotice({ tone: 'success', text: `User "${updated.full_name}" updated successfully.` })
      }
      closeModal()
    } catch (err) {
      setNotice({ tone: 'error', text: getErrorMessage(err, modalMode === 'create' ? 'Unable to create user.' : 'Unable to update user.') })
    } finally {
      setIsSubmitting(false)
      window.setTimeout(() => setNotice(null), 5000)
    }
  }

  async function toggleBlocked(user: User) {
    if (!auth.tokens?.access_token) return
    const nextStatus: StatusValue = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
    try {
      const updated = await updateUserByAdmin(auth.tokens.access_token, user.id, { status: nextStatus })
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setNotice({
        tone: 'success',
        text: nextStatus === 'BLOCKED' ? `User "${user.full_name}" has been blocked.` : `User "${user.full_name}" has been unblocked.`,
      })
    } catch (err) {
      setNotice({ tone: 'error', text: getErrorMessage(err, 'Unable to update user status.') })
    }
    window.setTimeout(() => setNotice(null), 5000)
  }

  async function deleteUser(user: User) {
    if (!auth.tokens?.access_token) return
    const confirmed = window.confirm(`Delete user "${user.full_name}"? Existing bookings will be kept under Deleted User.`)
    if (!confirmed) return

    setDeletingUserId(user.id)
    setNotice(null)
    try {
      await deleteUserByAdmin(auth.tokens.access_token, user.id)
      setUsers((current) => current.filter((item) => item.id !== user.id))
      setNotice({ tone: 'success', text: `User "${user.full_name}" has been deleted.` })
      void refreshUsers()
    } catch (err) {
      setNotice({ tone: 'error', text: getErrorMessage(err, 'Unable to delete user.') })
    } finally {
      setDeletingUserId(null)
      window.setTimeout(() => setNotice(null), 5000)
    }
  }

  return (
    <section className="user-management-page" aria-labelledby="user-mgmt-title">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">
            <UsersRound size={18} strokeWidth={2.5} />
            User Management
          </p>
          <h1 id="user-mgmt-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', marginTop: 16 }}>
            Manage all platform users.
          </h1>
        </div>
        <button className="primary-button compact-button" type="button" onClick={openCreateModal}>
          New user
          <span>
            <Plus size={18} strokeWidth={2.5} />
          </span>
        </button>
      </div>

      {notice && (
        <div className={`auth-notice ${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
          <span className="auth-notice-icon">
            {notice.tone === 'success' ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <AlertCircle size={18} strokeWidth={2.5} />}
          </span>
          <p>{notice.text}</p>
        </div>
      )}

      <div className="user-stats-grid">
        <StatCard tone="violet" icon={<UsersRound size={22} strokeWidth={2.5} />} label="Total users" value={stats.total} />
        <StatCard tone="mint" icon={<CheckCircle2 size={22} strokeWidth={2.5} />} label="Active" value={stats.active} />
        <StatCard tone="pink" icon={<Ban size={22} strokeWidth={2.5} />} label="Blocked" value={stats.blocked} />
        <StatCard tone="amber" icon={<ShieldCheck size={22} strokeWidth={2.5} />} label="Admins" value={stats.admins} />
      </div>

      <section className="admin-panel" aria-labelledby="user-table-title">
        <div className="panel-heading">
          <div>
            <h2 id="user-table-title">User directory</h2>
            <p>View, edit, block, or remove users from the platform.</p>
          </div>
          <div className="table-search">
            <Search size={18} strokeWidth={2.5} />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" aria-label="Search users" />
          </div>
        </div>

        <div className="user-table" role="table" aria-label="User directory">
          <div className="user-table-row user-table-head" role="row">
            <span role="columnheader" />
            <span role="columnheader">Name</span>
            <span role="columnheader">Email</span>
            <span role="columnheader">Role</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Actions</span>
          </div>

          {isLoading ? (
            <div className="user-table-row" role="row">
              <span role="cell" />
              <span role="cell">
                <LoaderCircle className="spin" size={16} strokeWidth={2.5} /> Loading users...
              </span>
              <span role="cell" />
              <span role="cell" />
              <span role="cell" />
              <span role="cell" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="user-table-row" role="row">
              <span role="cell" />
              <span role="cell">No users found.</span>
              <span role="cell" />
              <span role="cell" />
              <span role="cell" />
              <span role="cell" />
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = user.id === auth.user?.id
              const isDeleting = deletingUserId === user.id
              return (
                <div className="user-table-row" role="row" key={user.id}>
                  <div className="user-avatar-cell" role="cell">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <UserRound size={18} strokeWidth={2.5} />}
                  </div>
                  <span role="cell">{user.full_name}</span>
                  <span role="cell" style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                    {user.email ?? '-'}
                  </span>
                  <span role="cell">
                    <span className={`user-status-badge ${user.role === 'ADMIN' ? 'active' : ''}`}>{user.role}</span>
                  </span>
                  <span role="cell">
                    <span className={`user-status-badge ${user.status === 'BLOCKED' ? 'banned' : 'active'}`}>{user.status}</span>
                  </span>
                  <div className="user-action-buttons" role="cell">
                    <button type="button" title="Edit user" onClick={() => openEditModal(user)}>
                      <Edit3 size={14} strokeWidth={2.5} />
                    </button>
                    <button type="button" title={user.status === 'BLOCKED' ? 'Unblock user' : 'Block user'} onClick={() => toggleBlocked(user)}>
                      <Ban size={14} strokeWidth={2.5} />
                    </button>
                    <button className="danger" type="button" title="Delete user" disabled={isSelf || isDeleting} onClick={() => deleteUser(user)}>
                      {isDeleting ? <LoaderCircle className="spin" size={14} strokeWidth={2.5} /> : <Trash2 size={14} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {modalMode && (
        <div className="user-modal-overlay" onClick={closeModal}>
          <form className="user-modal" onClick={(event) => event.stopPropagation()} onSubmit={onSubmitForm}>
            <div className="user-modal-header">
              <h2>{modalMode === 'create' ? 'Create user' : 'Edit user'}</h2>
              <button className="icon-button" type="button" onClick={closeModal} style={{ width: 40, minHeight: 40 }}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <label className="field">
              <span>Full name</span>
              <input type="text" placeholder="Enter full name" value={formName} onChange={(event) => setFormName(event.target.value)} required />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="user@example.com"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                required
                disabled={modalMode === 'edit'}
              />
            </label>

            {modalMode === 'create' && (
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={formPassword}
                  onChange={(event) => setFormPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
            )}

            <label className="field">
              <span>Role</span>
              <select value={formRole} onChange={(event) => setFormRole(event.target.value as RoleValue)}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select value={formStatus} onChange={(event) => setFormStatus(event.target.value as StatusValue)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </label>

            <div className="user-modal-actions">
              <button className="secondary-button" type="button" onClick={closeModal} style={{ justifyContent: 'center' }}>
                Cancel
              </button>
              <button className="primary-button compact-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create user' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

function StatCard({ tone, icon, label, value }: { tone: string; icon: ReactNode; label: string; value: number }) {
  return (
    <article className={`user-stat-card ${tone}`}>
      <span className="metric-icon">{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body?.message ?? error.message
  if (error instanceof Error) return error.message
  return fallback
}
