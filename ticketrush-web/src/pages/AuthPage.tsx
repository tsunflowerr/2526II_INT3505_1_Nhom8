import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'

type AuthMode = 'login' | 'register'

export function AuthPage({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const isLogin = mode === 'login'

  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <div className="auth-copy">
        <p className="eyebrow">
          <Sparkles size={18} strokeWidth={2.5} />
          TicketRush account
        </p>
        <h1 id="auth-title">{isLogin ? 'Jump back into the rush.' : 'Create your event passport.'}</h1>
        <p className="hero-text">
          {isLogin
            ? 'Sign in to manage tickets, track favorite events, and keep checkout details ready.'
            : 'Save events, move faster at checkout, and get alerts when high-demand tickets start moving.'}
        </p>

        <div className="auth-art" aria-hidden="true">
          <div className="auth-ticket">
            <TicketCheck size={38} strokeWidth={2.5} />
            <span>{isLogin ? 'Fast lane' : 'New pass'}</span>
          </div>
          <div className="shape-stack">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
        <div className="auth-tabs" role="tablist" aria-label="Account mode">
          <button
            className={isLogin ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={isLogin}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={!isLogin}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <div className="form-heading">
          <span className={isLogin ? 'form-icon' : 'form-icon pink'}>
            {isLogin ? (
              <LockKeyhole size={24} strokeWidth={2.5} />
            ) : (
              <UserRound size={24} strokeWidth={2.5} />
            )}
          </span>
          <div>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <p>{isLogin ? 'Use your TicketRush account.' : 'Backend signup can connect here later.'}</p>
          </div>
        </div>

        <div className="social-login-grid">
          <button className="social-button google" type="button">
            <span>G</span>
            Google
          </button>
          <button className="social-button facebook" type="button">
            <span>f</span>
            Facebook
          </button>
        </div>

        <div className="form-divider">
          <span>or continue with email</span>
        </div>

        {!isLogin && (
          <label className="field">
            <span>Full name</span>
            <div className="input-shell">
              <UserRound size={20} strokeWidth={2.5} aria-hidden="true" />
              <input type="text" placeholder="Alex Morgan" autoComplete="name" required />
            </div>
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <div className="input-shell">
            <Mail size={20} strokeWidth={2.5} aria-hidden="true" />
            <input type="email" placeholder="you@example.com" autoComplete="email" required />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <div className="input-shell">
            <LockKeyhole size={20} strokeWidth={2.5} aria-hidden="true" />
            <input
              type="password"
              placeholder={isLogin ? 'Enter password' : 'At least 8 characters'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </div>
        </label>

        {isLogin ? (
          <div className="form-row">
            <label className="check-row">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#forgot">Forgot password?</a>
          </div>
        ) : (
          <label className="check-row terms-row">
            <input type="checkbox" required />
            <span>I agree to TicketRush updates and account terms.</span>
          </label>
        )}

        <button className="primary-button" type="submit">
          {isLogin ? 'Sign in' : 'Create account'}
          <span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </button>

        <div className="auth-note">
          <ShieldCheck size={18} strokeWidth={2.5} />
          Secure auth placeholder, ready for your backend.
        </div>
      </form>
    </section>
  )
}
