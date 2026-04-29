import { CircleUserRound, ShieldCheck, Ticket } from 'lucide-react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminCreateEventPage } from './pages/AdminCreateEventPage'
import { AuthPage } from './pages/AuthPage'
import { DiscoveryPage } from './pages/DiscoveryPage'

function App() {
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
          <NavLink to="/auth">
            <CircleUserRound size={18} strokeWidth={2.5} />
            Account
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
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/events/new" element={<AdminCreateEventPage />} />
      </Routes>
    </main>
  )
}

export default App
