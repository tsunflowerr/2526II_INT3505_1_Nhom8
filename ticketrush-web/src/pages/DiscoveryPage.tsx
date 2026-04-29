import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  LoaderCircle,
  MapPin,
  Mic,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate, listEvents } from '../services/ticketRushApi'
import type { EventItem, EventKind } from '../types'

type ExploreTab = 'ALL' | 'EVENT' | 'MOVIE' | 'FLASH' | 'LOW'
type SortOption = 'date-asc' | 'price-asc' | 'price-desc' | 'name-asc'

const tabs: Array<{ id: ExploreTab; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'EVENT', label: 'Events' },
  { id: 'MOVIE', label: 'Movies' },
  { id: 'FLASH', label: 'Flash Sale' },
  { id: 'LOW', label: 'Almost Sold Out' },
]

const pageSize = 6

export function DiscoveryPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<ExploreTab>('ALL')
  const [date, setDate] = useState('')
  const [sort, setSort] = useState<SortOption>('date-asc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    void loadEvents()
  }, [])

  async function loadEvents() {
    setIsLoading(true)
    setError(null)

    try {
      const eventList = await listEvents()
      setEvents(eventList)
    } catch {
      setError('Could not load TicketRush inventory right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return events
      .filter((event) => {
        const searchableText = [
          event.name,
          event.category,
          event.kind,
          event.city,
          event.venue,
          event.date,
          formatDate(event.date),
          ...event.tags,
          ...(event.movie?.genres ?? []),
        ]
          .join(' ')
          .toLowerCase()

        const tabMatch =
          tab === 'ALL' ||
          event.kind === (tab as EventKind) ||
          (tab === 'FLASH' && event.status === 'Flash Sale') ||
          (tab === 'LOW' && event.status === 'Almost Sold Out')

        return (!normalizedQuery || searchableText.includes(normalizedQuery)) && tabMatch && (!date || event.date === date)
      })
      .sort((first, second) => {
        if (sort === 'price-asc') return first.priceFrom - second.priceFrom
        if (sort === 'price-desc') return second.priceFrom - first.priceFrom
        if (sort === 'name-asc') return first.name.localeCompare(second.name)
        return first.date.localeCompare(second.date)
      })
  }, [date, events, query, sort, tab])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize))
  const visibleEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize)
  const hasFilters = Boolean(query || date || tab !== 'ALL' || sort !== 'date-asc')
  const featuredEvent = events.find((event) => event.kind === 'MOVIE') ?? events[0]

  function resetFilters() {
    setQuery('')
    setTab('ALL')
    setDate('')
    setSort('date-asc')
    setPage(1)
  }

  return (
    <>
      <section className="hero-section explore-hero" aria-labelledby="page-title">
        {featuredEvent ? (
          <FeaturedEvent event={featuredEvent} />
        ) : (
          <div className="featured-event-card loading-feature">
            <LoaderCircle className="spin" size={34} strokeWidth={2.5} />
            <span>Loading featured tickets</span>
          </div>
        )}
      </section>

      <section className="discovery-section" aria-labelledby="discover-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <SlidersHorizontal size={18} strokeWidth={2.5} />
              Explore Tickets
            </p>
            <h2 id="discover-title">Events, movies, and flash sales.</h2>
          </div>
          <p>
            Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>

        <form className="filters explore-filters" onSubmit={(event) => event.preventDefault()}>
          <label className="field search-field">
            <span>Search</span>
            <div className="input-shell search-with-mic">
              <Search size={20} strokeWidth={2.5} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Movie, event, venue, soundtrack..."
              />
              <Link className="mic-search-button" to="/sound-search" aria-label="Find movie by humming">
                <Mic size={19} strokeWidth={2.5} />
              </Link>
            </div>
          </label>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setPage(1)
              }}
            />
          </label>

          <label className="field">
            <span>Sort</span>
            <div className="select-shell">
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortOption)
                  setPage(1)
                }}
              >
                <option value="date-asc">Soonest first</option>
                <option value="price-asc">Lowest price</option>
                <option value="price-desc">Highest price</option>
                <option value="name-asc">Name A-Z</option>
              </select>
            </div>
          </label>
        </form>

        <div className="category-strip" aria-label="Explore filters">
          {tabs.map((item) => (
            <button
              className={item.id === tab ? 'chip active' : 'chip'}
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id)
                setPage(1)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <StateBlock icon={<LoaderCircle className="spin" size={34} strokeWidth={2.5} />} title="Loading tickets" text="Preparing events, movies, showtimes, and live ticket status." />
        ) : error ? (
          <StateBlock
            icon={<RotateCcw size={34} strokeWidth={2.5} />}
            title="Inventory unavailable"
            text={error}
            action={
              <button className="secondary-button" type="button" onClick={loadEvents}>
                <RotateCcw size={18} strokeWidth={2.5} />
                Try again
              </button>
            }
          />
        ) : visibleEvents.length === 0 ? (
          <StateBlock
            icon={<Search size={34} strokeWidth={2.5} />}
            title="No matching listings"
            text="Change your search, date, or explore tab."
            action={
              hasFilters ? (
                <button className="secondary-button" type="button" onClick={resetFilters}>
                  <RotateCcw size={18} strokeWidth={2.5} />
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="event-grid">
              {visibleEvents.map((event, index) => (
                <EventCard event={event} key={event.id} index={index} />
              ))}
            </div>

            <nav className="pagination" aria-label="Ticket pages">
              <button className="icon-button" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button className="icon-button" type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next page">
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </nav>
          </>
        )}
      </section>
    </>
  )
}

function FeaturedEvent({ event }: { event: EventItem }) {
  const soldPercent = Math.round((event.sold / event.capacity) * 100)

  return (
    <article className="featured-event-card" aria-labelledby="page-title">
      <div className="featured-poster">
        <img src={event.imageUrl} alt="" />
        <span className="status-pill">{event.status}</span>
      </div>

      <div className="featured-info">
        <p className="eyebrow">
          <Sparkles size={18} strokeWidth={2.5} />
          Featured {event.kind === 'MOVIE' ? 'Movie' : 'Event'}
        </p>
        <h1 className="featured-title" id="page-title">
          <span>{event.name}</span>
        </h1>
        <p className="hero-text">{event.description}</p>

        <dl className="featured-meta">
          <Meta icon={<CalendarDays size={18} strokeWidth={2.5} />} label="Date" value={formatDate(event.date)} />
          <Meta icon={<Clock size={18} strokeWidth={2.5} />} label="Time" value={event.time} />
          <Meta icon={<MapPin size={18} strokeWidth={2.5} />} label="Venue" value={`${event.venue}, ${event.city}`} />
          <Meta icon={<CircleDollarSign size={18} strokeWidth={2.5} />} label="From" value={formatCurrency(event.priceFrom)} />
        </dl>

        <div className="featured-sales">
          <div>
            <strong>{soldPercent}%</strong>
            <span>sold</span>
          </div>
          <div className="capacity-bar" aria-label={`${soldPercent}% sold`}>
            <span style={{ width: `${soldPercent}%` }} />
          </div>
        </div>

        <Link className="primary-button featured-cta" to={`/events/${event.id}`}>
          View Details
          <span>
            <Ticket size={18} strokeWidth={2.5} />
          </span>
        </Link>
      </div>
    </article>
  )
}

function EventCard({ event, index }: { event: EventItem; index: number }) {
  const tone = ['blue', 'green', 'amber', 'gray'][index % 4]
  const soldPercent = Math.round((event.sold / event.capacity) * 100)

  return (
    <article className={`event-card ${tone}`}>
      <div className="event-art">
        <img src={event.imageUrl} alt="" />
        <span className="status-pill">{event.status}</span>
      </div>
      <div className="event-body">
        <div className="card-topline">
          <span>{event.kind === 'MOVIE' ? 'Movie' : 'Event'}</span>
          <span>{event.city}</span>
        </div>
        <h3>{event.name}</h3>
        <dl className="event-meta">
          <Meta icon={<CalendarDays size={18} strokeWidth={2.5} />} label="Date" value={formatDate(event.date)} />
          <Meta icon={<Clock size={18} strokeWidth={2.5} />} label="Time" value={event.time} />
          <Meta icon={<MapPin size={18} strokeWidth={2.5} />} label="Venue" value={event.venue} />
          <Meta icon={<UsersRound size={18} strokeWidth={2.5} />} label="Filled" value={`${soldPercent}%`} />
        </dl>
        <Link className="primary-button" to={`/events/${event.id}`}>
          Book Seats
          <span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </Link>
      </div>
    </article>
  )
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div>
      {icon}
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function StateBlock({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <div className="state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
