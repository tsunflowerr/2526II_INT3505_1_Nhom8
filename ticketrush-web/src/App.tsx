import { CircleUserRound, ShieldCheck, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminCreateEventPage } from './pages/AdminCreateEventPage'
import { AuthPage } from './pages/AuthPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { SeatMapDesignerPage } from './pages/SeatMapDesignerPage'
import { AUTH_CHANGE_EVENT, loadTokens } from './services/authStorage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(loadTokens()?.access_token))

  useEffect(() => {
    function refreshAuthState() {
      setIsAuthenticated(Boolean(loadTokens()?.access_token))
    }

    window.addEventListener(AUTH_CHANGE_EVENT, refreshAuthState)
    window.addEventListener('storage', refreshAuthState)

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, refreshAuthState)
      window.removeEventListener('storage', refreshAuthState)
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="site-header">
        <NavLink className="brand-mark" to="/" aria-label="TicketRush home">
          <span>
            <Ticket size={22} strokeWidth={2.5} />
          </span>
          TicketRush
        </NavLink>

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/">Events</NavLink>
          <NavLink to={isAuthenticated ? '/auth' : '/login'}>
            <CircleUserRound size={18} strokeWidth={2.5} />
            {isAuthenticated ? 'Account' : 'Login'}
          </NavLink>
          <NavLink to="/admin">
            <ShieldCheck size={18} strokeWidth={2.5} />
            Admin
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<DiscoveryPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback/google" element={<AuthPage initialMode="login" />} />
        <Route path="/auth/callback/facebook" element={<AuthPage initialMode="login" />} />
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/events/new" element={<AdminCreateEventPage />} />
        <Route path="/admin/events/new/seat-map" element={<SeatMapDesignerPage />} />
      </Routes>
    </main>
  )
}

export default App
