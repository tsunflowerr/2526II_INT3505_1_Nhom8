import {
  BarChart3,
  CalendarPlus,
  CircleDollarSign,
  ClipboardList,
  MoreHorizontal,
  Search,
  Ticket,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const metrics = [
  { label: 'Total events', value: '128', detail: '+14 this month', tone: 'violet' },
  { label: 'Tickets sold', value: '42.8k', detail: '86% fulfillment', tone: 'pink' },
  { label: 'Revenue', value: '$1.2M', detail: '+18.4% growth', tone: 'amber' },
  { label: 'Customers', value: '19.6k', detail: '2.1k new', tone: 'mint' },
]

const rows = [
  ['Neon Sunset Live', 'Concert', 'May 8, 2026', 'Selling fast', '$64'],
  ['City Finals Showdown', 'Sports', 'May 12, 2026', 'Few left', '$88'],
  ['Block Party Weekender', 'Festival', 'May 22, 2026', 'Available', '$39'],
  ['Rooftop Comedy Jam', 'Comedy', 'Jul 10, 2026', 'Available', '$31'],
]

const revenue = [42, 58, 46, 76, 88, 70, 96]
const categoryMix = [
  ['Concert', 38, 'var(--accent)'],
  ['Sports', 24, 'var(--secondary)'],
  ['Festival', 18, 'var(--tertiary)'],
  ['Theater', 12, 'var(--quaternary)'],
]
const funnel = [
  ['Views', 100],
  ['Holds', 68],
  ['Checkout', 42],
  ['Sold', 31],
]

export function AdminDashboardPage() {
  return (
    <section className="admin-page" aria-labelledby="admin-title">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">
            <ClipboardList size={18} strokeWidth={2.5} />
            Admin dashboard
          </p>
          <h1 id="admin-title">Control room for every ticket drop.</h1>
        </div>
        <Link className="primary-button compact-button" to="/admin/events/new">
          New event
          <span>
            <CalendarPlus size={18} strokeWidth={2.5} />
          </span>
        </Link>
      </div>

      <div className="metric-grid">
        {metrics.map((metric) => (
          <article className={`metric-card ${metric.tone}`} key={metric.label}>
            <span className="metric-icon">
              {metric.label === 'Total events' && <Ticket size={24} strokeWidth={2.5} />}
              {metric.label === 'Tickets sold' && <BarChart3 size={24} strokeWidth={2.5} />}
              {metric.label === 'Revenue' && <CircleDollarSign size={24} strokeWidth={2.5} />}
              {metric.label === 'Customers' && <UsersRound size={24} strokeWidth={2.5} />}
            </span>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </div>

      <div className="chart-grid">
        <section className="admin-panel chart-panel" aria-labelledby="revenue-title">
          <div className="panel-heading compact">
            <div>
              <h2 id="revenue-title">Revenue pulse</h2>
              <p>Last 7 active selling days.</p>
            </div>
            <TrendingUp size={26} strokeWidth={2.5} />
          </div>
          <div className="bar-chart" aria-label="Revenue bar chart">
            {revenue.map((value, index) => (
              <span key={index} style={{ height: `${value}%` }}>
                <i>{value}</i>
              </span>
            ))}
          </div>
        </section>

        <section className="admin-panel chart-panel" aria-labelledby="category-title">
          <h2 id="category-title">Category mix</h2>
          <div className="donut-wrap">
            <div className="donut-chart" aria-hidden="true" />
            <div className="chart-legend">
              {categoryMix.map(([label, value, color]) => (
                <span key={label}>
                  <i style={{ background: color }} />
                  {label} {value}%
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-panel chart-panel" aria-labelledby="funnel-title">
          <h2 id="funnel-title">Checkout funnel</h2>
          <div className="funnel-chart">
            {funnel.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}%</strong>
                <i style={{ width: `${value}%` }} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-layout">
        <section className="admin-panel" aria-labelledby="events-table-title">
          <div className="panel-heading">
            <div>
              <h2 id="events-table-title">Event inventory</h2>
              <p>Manage listings, capacity, and ticket price floors.</p>
            </div>
            <div className="table-search">
              <Search size={18} strokeWidth={2.5} />
              <input type="search" placeholder="Search events" aria-label="Search admin events" />
            </div>
          </div>

          <div className="event-table" role="table" aria-label="Admin events">
            <div className="table-row table-head" role="row">
              <span role="columnheader">Event</span>
              <span role="columnheader">Category</span>
              <span role="columnheader">Date</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">From</span>
              <span role="columnheader">Actions</span>
            </div>
            {rows.map((row) => (
              <div className="table-row" role="row" key={row[0]}>
                {row.map((cell) => (
                  <span role="cell" key={cell}>
                    {cell}
                  </span>
                ))}
                <button className="tiny-icon-button" type="button" aria-label={`Open ${row[0]} actions`}>
                  <MoreHorizontal size={18} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="admin-panel side-panel" aria-labelledby="ops-title">
          <h2 id="ops-title">Ops queue</h2>
          <div className="queue-item">
            <strong>12</strong>
            <span>Pending venue approvals</span>
          </div>
          <div className="queue-item">
            <strong>7</strong>
            <span>Events need hero images</span>
          </div>
          <div className="queue-item">
            <strong>3</strong>
            <span>Price rules expiring today</span>
          </div>
        </aside>
      </div>
    </section>
  )
}
