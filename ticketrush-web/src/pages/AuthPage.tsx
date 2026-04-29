import { AlertCircle, ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../services/userApi'

type AuthMode = 'login' | 'register'

export function AuthPage({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(initialMode === 'login' ? 'admin@ticketrush.test' : '')
  const [password, setPassword] = useState('password123')
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLogin = mode === 'login'

  if (auth.isAuthenticated && !auth.isLoading) {
    return <Navigate to="/profile" replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await (isLogin
        ? auth.signIn({ email, password }, rememberMe)
        : auth.signUp({ email, password, full_name: fullName || 'TicketRush Member' }, rememberMe))
      navigate(searchParams.get('next') || '/profile', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <div className="auth-copy">
        <p className="eyebrow">
          <Sparkles size={18} strokeWidth={2.5} />
          TicketRush Account
        </p>
        <h1 id="auth-title">{isLogin ? 'Sign in to unlock tickets.' : 'Create your TicketRush pass.'}</h1>
        <p className="hero-text">
          Use any email for a customer account. Use an email containing <strong>admin</strong> to open the protected admin console.
        </p>
      </div>

      <form className="auth-card auth-form-stack" onSubmit={onSubmit}>
        <div className="auth-tabs" role="tablist" aria-label="Account mode">
          <button
            className={isLogin ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={isLogin}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            Sign in
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={!isLogin}
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            Create account
          </button>
        </div>

        {error && (
          <div className="auth-notice error" role="alert">
            <span className="auth-notice-icon">
              <AlertCircle size={18} strokeWidth={2.5} />
            </span>
            <p>{error}</p>
          </div>
        )}

        <div className="form-heading">
          <span className="form-icon">
            {isLogin ? <LockKeyhole size={24} strokeWidth={2.5} /> : <UserRound size={24} strokeWidth={2.5} />}
          </span>
          <div>
            <h2>{isLogin ? 'Welcome back' : 'Start booking'}</h2>
            <p>{isLogin ? 'Access tickets, notifications, and admin tools.' : 'Create a profile for faster checkout.'}</p>
          </div>
        </div>

        {!isLogin && (
          <label className="field">
            <span>Full name</span>
            <div className="input-shell">
              <UserRound size={20} strokeWidth={2.5} aria-hidden="true" />
              <input type="text" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <div className="input-shell">
            <Mail size={20} strokeWidth={2.5} aria-hidden="true" />
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@ticketrush.test"
            />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <div className="input-shell">
            <LockKeyhole size={20} strokeWidth={2.5} aria-hidden="true" />
            <input
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>

        <label className="check-row terms-row">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
          <span>Keep me signed in on this device</span>
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
          <span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </button>

        <div className="auth-note">
          <ShieldCheck size={18} strokeWidth={2.5} />
          Demo admin: sign in with any email containing "admin".
        </div>
        <Link className="text-link" to="/">
          Back to Explore
        </Link>
      </form>
    </section>
  )
}
