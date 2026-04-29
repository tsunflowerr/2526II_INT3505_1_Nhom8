import { ArrowRight, Mail, PartyPopper, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export function RegisterPage() {
  return (
    <section className="auth-page register-page" aria-labelledby="register-title">
      <div className="auth-copy">
        <p className="eyebrow">
          <Sparkles size={18} strokeWidth={2.5} />
          Join TicketRush
        </p>
        <h1 id="register-title">Create your event passport.</h1>
        <p className="hero-text">
          Build a profile for saved events, faster checkout, and alerts when
          high-demand tickets start moving.
        </p>

        <div className="benefit-grid">
          <div>
            <ShieldCheck size={22} strokeWidth={2.5} />
            Secure checkout-ready profile
          </div>
          <div>
            <PartyPopper size={22} strokeWidth={2.5} />
            Personalized event picks
          </div>
        </div>
      </div>

      <form className="auth-card featured-auth" onSubmit={(event) => event.preventDefault()}>
        <div className="form-heading">
          <span className="form-icon pink">
            <UserRound size={24} strokeWidth={2.5} />
          </span>
          <div>
            <h2>Register</h2>
            <p>Your backend can own account creation later.</p>
          </div>
        </div>

        <label className="field">
          <span>Full name</span>
          <div className="input-shell">
            <UserRound size={20} strokeWidth={2.5} aria-hidden="true" />
            <input type="text" placeholder="Alex Morgan" autoComplete="name" required />
          </div>
        </label>

        <label className="field">
          <span>Email</span>
          <div className="input-shell">
            <Mail size={20} strokeWidth={2.5} aria-hidden="true" />
            <input type="email" placeholder="you@example.com" autoComplete="email" required />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="check-row terms-row">
          <input type="checkbox" required />
          <span>I agree to TicketRush updates and account terms.</span>
        </label>

        <button className="primary-button" type="submit">
          Create account
          <span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </button>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  )
}
