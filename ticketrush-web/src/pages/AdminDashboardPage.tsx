import { BarChart3, CalendarPlus, Clapperboard, Gauge, Headphones, LayoutDashboard, Search, Ticket, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate, getDashboardMetrics } from '../services/ticketRushApi'
import type { DashboardMetrics } from '../types'

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      const nextMetrics = await getDashboardMetrics()
      if (!cancelled) setMetrics(nextMetrics)
    }

    void loadDashboard()
    const timer = window.setInterval(loadDashboard, 3000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">Realtime Control Room</p>
            <h1 id="admin-title">TicketRush Admin</h1>
          </div>
          <Link className="primary-button compact-button" to="/admin/events/new">
            Create Listing
            <span>
              <CalendarPlus size={18} />
            </span>
          </Link>
        </header>

        {metrics && (
          <>
            <div className="stat-grid">
              <StatBlock icon={<Ticket />} label="Event revenue" value={formatCurrency(metrics.eventRevenue)} tone="blue" />
              <StatBlock icon={<Clapperboard />} label="Movie revenue" value={formatCurrency(metrics.movieRevenue)} tone="green" />
              <StatBlock icon={<BarChart3 />} label="Tickets sold" value={metrics.ticketsSold.toLocaleString('en-US')} tone="amber" />
              <StatBlock icon={<Gauge />} label="Queue load" value={metrics.queueLoad.toLocaleString('en-US')} tone="dark" />
            </div>

            <div className="admin-content-grid">
              <section className="admin-card chart-panel" aria-labelledby="revenue-title">
                <div className="panel-heading compact">
                  <div>
                    <h2 id="revenue-title">Revenue pulse</h2>
                    <p>Mock realtime polling every 3 seconds.</p>
                  </div>
                </div>
                <div className="bar-chart flat-bars" aria-label="Revenue chart">
                  {metrics.revenueSeries.map((value, index) => (
                    <span key={index} style={{ height: `${value}%` }}>
                      <i>{value}</i>
                    </span>
                  ))}
                </div>
              </section>

              <section className="admin-card chart-panel" aria-labelledby="seat-state-title">
                <h2 id="seat-state-title">Seat state</h2>
                <div className="seat-state-stack">
                  <div>
                    <strong>{metrics.availableSeats}</strong>
                    <span>Available</span>
                  </div>
                  <div>
                    <strong>{metrics.holdingSeats}</strong>
                    <span>Held</span>
                  </div>
                  <div>
                    <strong>{metrics.soldSeats}</strong>
                    <span>Sold</span>
                  </div>
                </div>
              </section>

              <section className="admin-card chart-panel" aria-labelledby="sound-funnel-title">
                <h2 id="sound-funnel-title">Soundtrack funnel</h2>
                <div className="funnel-stack">
                  <div><strong>{metrics.soundtrackInsights.length}</strong><span>hummed searches</span></div>
                  <div><strong>{metrics.soundtrackInsights.filter((item) => item.conversionStatus !== 'Matched').length}</strong><span>opened seats</span></div>
                  <div><strong>{metrics.topMovies.length}</strong><span>movie candidates</span></div>
                </div>
              </section>
            </div>

            <div className="admin-table-grid">
              <section className="admin-card" aria-labelledby="events-table-title">
                <div className="panel-heading">
                  <div>
                    <h2 id="events-table-title">Active inventory</h2>
                    <p>Events and movies share the same seat lifecycle.</p>
                  </div>
                  <div className="table-search">
                    <Search size={18} />
                    <input type="search" placeholder="Search inventory" aria-label="Search admin inventory" />
                  </div>
                </div>

                <div className="event-table" role="table" aria-label="Admin inventory">
                  <div className="table-row table-head" role="row">
                    <span role="columnheader">Name</span>
                    <span role="columnheader">Type</span>
                    <span role="columnheader">Date</span>
                    <span role="columnheader">Status</span>
                    <span role="columnheader">Fill</span>
                    <span role="columnheader">Revenue</span>
                  </div>
                  {metrics.activeEvents.map((row) => (
                    <div className="table-row" role="row" key={row.id}>
                      <span role="cell">{row.name}</span>
                      <span role="cell">{row.kind === 'MOVIE' ? 'Movie' : 'Event'}</span>
                      <span role="cell">{formatDate(row.date)}</span>
                      <span role="cell">{row.status}</span>
                      <span role="cell">{Math.round((row.sold / row.capacity) * 100)}%</span>
                      <span role="cell">{formatCurrency(row.revenue)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="admin-card" aria-labelledby="top-movies-title">
                <h2 id="top-movies-title">Top movies</h2>
                <div className="rank-list">
                  {metrics.topMovies.map((movie, index) => (
                    <Link to={`/events/${movie.id}`} key={movie.id}>
                      <strong>{index + 1}</strong>
                      <span>{movie.name}</span>
                      <small>{movie.sold}/{movie.capacity}</small>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>

            <section className="admin-card" aria-labelledby="sound-insights-title">
              <div className="panel-heading">
                <div>
                  <h2 id="sound-insights-title">Sound Search Insights</h2>
                  <p>Tracks which soundtrack searches lead users toward movie bookings.</p>
                </div>
                <Headphones size={28} />
              </div>
              <div className="event-table sound-table" role="table" aria-label="Sound search insights">
                <div className="table-row table-head" role="row">
                  <span role="columnheader">Song</span>
                  <span role="columnheader">Movie</span>
                  <span role="columnheader">Confidence</span>
                  <span role="columnheader">Conversion</span>
                </div>
                {metrics.soundtrackInsights.map((row) => (
                  <div className="table-row" role="row" key={row.id}>
                    <span role="cell">{row.songTitle}</span>
                    <span role="cell">{row.movieName}</span>
                    <span role="cell">{row.confidence}%</span>
                    <span role="cell">{row.conversionStatus}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </section>
  )
}

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" to="/">
        <Ticket size={24} />
        TicketRush
      </Link>
      <nav>
        <Link className="active" to="/admin">
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link to="/admin/events/new">
          <CalendarPlus size={18} />
          Create Listing
        </Link>
        <Link to="/profile">
          <UsersRound size={18} />
          Profile
        </Link>
      </nav>
    </aside>
  )
}

function StatBlock({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <article className={`stat-block ${tone}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}
