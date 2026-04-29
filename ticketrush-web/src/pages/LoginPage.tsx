import { ArrowRight, LockKeyhole, Mail, Sparkles, TicketCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <section className="auth-page" aria-labelledby="login-title">
      <div className="auth-copy">
        <p className="eyebrow">
          <Sparkles size={18} strokeWidth={2.5} />
          Welcome back
        </p>
        <h1 id="login-title">Jump back into the rush.</h1>
        <p className="hero-text">
          Sign in to manage tickets, track favorite events, and keep checkout
          details ready for the next big drop.
        </p>

        <div className="auth-art" aria-hidden="true">
          <div className="auth-ticket">
            <TicketCheck size={38} strokeWidth={2.5} />
            <span>Fast lane</span>
          </div>
          <div className="shape-stack">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
        <div className="form-heading">
          <span className="form-icon">
            <LockKeyhole size={24} strokeWidth={2.5} />
          </span>
          <div>
            <h2>Login</h2>
            <p>Use your TicketRush account.</p>
          </div>
        </div>

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
              placeholder="Enter password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </div>
        </label>

        <div className="form-row">
          <label className="check-row">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
          <a href="#forgot">Forgot password?</a>
        </div>

        <button className="primary-button" type="submit">
          Sign in
          <span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  )
}
