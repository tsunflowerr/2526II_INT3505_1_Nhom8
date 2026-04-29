import { NavLink, Route, Routes } from 'react-router-dom'
import { ShieldCheck, Ticket } from 'lucide-react'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

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
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/admin">
            <ShieldCheck size={18} strokeWidth={2.5} />
            Admin
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<DiscoveryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
    </main>
  )
}

export default App
