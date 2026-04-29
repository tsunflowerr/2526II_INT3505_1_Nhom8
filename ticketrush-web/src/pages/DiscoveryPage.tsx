import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Frown,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchEvents } from '../services/events'
import type { EventCategory, EventItem } from '../types'

const categories: Array<EventCategory | 'All'> = [
  'All',
  'Concert',
  'Sports',
  'Theater',
  'Festival',
  'Workshop',
  'Comedy',
]

const pageSize = 6
type SortOption = 'date-asc' | 'price-asc' | 'price-desc' | 'name-asc'

export function DiscoveryPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EventCategory | 'All'>('All')
  const [date, setDate] = useState('')
  const [sort, setSort] = useState<SortOption>('date-asc')
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setIsLoading(true)
    setError(null)

    try {
      const eventList = await fetchEvents()
      setEvents(eventList)
    } catch {
      setError('We could not load events right now. Please try again.')
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
          event.city,
          event.venue,
          event.date,
          formatDate(event.date),
          ...event.tags,
        ]
          .join(' ')
          .toLowerCase()

        return (
          (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
          (category === 'All' || event.category === category) &&
          (!date || event.date === date)
        )
      })
      .sort((first, second) => {
        if (sort === 'price-asc') return first.priceFrom - second.priceFrom
        if (sort === 'price-desc') return second.priceFrom - first.priceFrom
        if (sort === 'name-asc') return first.name.localeCompare(second.name)
        return first.date.localeCompare(second.date)
      })
  }, [category, date, events, query, sort])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize))
  const visibleEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize)
  const hasFilters = Boolean(query || date || category !== 'All' || sort !== 'date-asc')
  const featuredEvent = events[0]

  function resetFilters() {
    setQuery('')
    setCategory('All')
    setDate('')
    setSort('date-asc')
    setPage(1)
  }

  return (
    <>
      <section className="hero-section" aria-labelledby="page-title">
        <div className="confetti confetti-one" aria-hidden="true" />
        <div className="confetti confetti-two" aria-hidden="true" />
        <div className="confetti confetti-three" aria-hidden="true" />

        {featuredEvent ? (
          <FeaturedEvent event={featuredEvent} onViewTickets={() => setSelectedEvent(featuredEvent)} />
        ) : (
          <div className="featured-event-card loading-feature">
            <LoaderCircle className="spin" size={34} strokeWidth={2.5} />
            <span>Loading main event</span>
          </div>
        )}
      </section>

      <section className="discovery-section" aria-labelledby="discover-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <SlidersHorizontal size={18} strokeWidth={2.5} />
              Browse events
            </p>
            <h2 id="discover-title">Discover tickets</h2>
          </div>
          <p>
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
          </p>
        </div>

        <form className="filters" onSubmit={(event) => event.preventDefault()}>
          <label className="field search-field">
            <span>Search</span>
            <div className="input-shell">
              <Search size={20} strokeWidth={2.5} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Name, date, category, city..."
              />
            </div>
          </label>

          <label className="field">
            <span>Category</span>
            <div className="select-shell">
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as EventCategory | 'All')
                  setPage(1)
                }}
              >
                {categories.map((eventCategory) => (
                  <option key={eventCategory} value={eventCategory}>
                    {eventCategory}
                  </option>
                ))}
              </select>
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
                <option value="name-asc">A to Z</option>
              </select>
            </div>
          </label>
        </form>

        <div className="category-strip" aria-label="Quick category filters">
          {categories.map((eventCategory) => (
            <button
              className={eventCategory === category ? 'chip active' : 'chip'}
              key={eventCategory}
              type="button"
              onClick={() => {
                setCategory(eventCategory)
                setPage(1)
              }}
            >
              {eventCategory}
            </button>
          ))}
        </div>

        {isLoading ? (
          <StateBlock
            icon={<LoaderCircle className="spin" size={34} strokeWidth={2.5} />}
            title="Loading the lineup"
            text="Pulling the newest events into place."
          />
        ) : error ? (
          <StateBlock
            icon={<AlertCircle size={34} strokeWidth={2.5} />}
            title="Events missed the stage"
            text={error}
            action={
              <button className="secondary-button" type="button" onClick={loadEvents}>
                <RotateCcw size={18} strokeWidth={2.5} />
                Retry
              </button>
            }
          />
        ) : visibleEvents.length === 0 ? (
          <StateBlock
            icon={<Frown size={34} strokeWidth={2.5} />}
            title="No matching events"
            text="Try a different search, category, date, or sort option."
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
                <EventCard
                  event={event}
                  key={event.id}
                  index={index}
                  onViewTickets={() => setSelectedEvent(event)}
                />
              ))}
            </div>

            <nav className="pagination" aria-label="Event pages">
              <button
                className="icon-button"
                type="button"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="icon-button"
                type="button"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </nav>
          </>
        )}
      </section>

      {selectedEvent && (
        <TicketDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  )
}

function FeaturedEvent({
  event,
  onViewTickets,
}: {
  event: EventItem
  onViewTickets: () => void
}) {
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
          Main event
        </p>
        <h1 className="featured-title" id="page-title">
          <span>{event.name}</span>
        </h1>
        <p className="hero-text">{event.description}</p>

        <dl className="featured-meta">
          <Meta icon={<CalendarDays size={18} strokeWidth={2.5} />} label="Date" value={formatDate(event.date)} />
          <Meta icon={<Clock size={18} strokeWidth={2.5} />} label="Time" value={event.time} />
          <Meta icon={<MapPin size={18} strokeWidth={2.5} />} label="Venue" value={`${event.venue}, ${event.city}`} />
          <Meta icon={<CircleDollarSign size={18} strokeWidth={2.5} />} label="From" value={`$${event.priceFrom}`} />
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

        <button className="primary-button featured-cta" type="button" onClick={onViewTickets}>
          View tickets
          <span>
            <Ticket size={18} strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </article>
  )
}

function EventCard({
  event,
  index,
  onViewTickets,
}: {
  event: EventItem
  index: number
  onViewTickets: () => void
}) {
  const tone = ['violet', 'pink', 'amber', 'mint'][index % 4]

  return (
    <article className={`event-card ${tone}`}>
      <div className="event-art">
        <img src={event.imageUrl} alt="" />
        <span className="status-pill">{event.status}</span>
      </div>
      <div className="event-body">
        <div className="card-topline">
          <span>{event.category}</span>
          <span>{event.city}</span>
        </div>
        <h3>{event.name}</h3>
        <dl className="event-meta">
          <Meta icon={<CalendarDays size={18} strokeWidth={2.5} />} label="Date" value={formatDate(event.date)} />
          <Meta icon={<Clock size={18} strokeWidth={2.5} />} label="Time" value={event.time} />
          <Meta icon={<MapPin size={18} strokeWidth={2.5} />} label="Venue" value={event.venue} />
          <Meta icon={<CircleDollarSign size={18} strokeWidth={2.5} />} label="Price" value={`From $${event.priceFrom}`} />
        </dl>
        <button className="primary-button" type="button" onClick={onViewTickets}>
          View tickets
          <span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </article>
  )
}

function TicketDetails({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const soldPercent = Math.round((event.sold / event.capacity) * 100)
  const tiers = [
    ['General Admission', event.priceFrom, 'Flexible standing area'],
    ['Reserved Seat', event.priceFrom + 32, 'Best value sightlines'],
    ['VIP Pop Pass', event.priceFrom + 94, 'Priority entry and lounge access'],
  ] as const

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="ticket-modal"
        aria-labelledby="ticket-detail-title"
        aria-modal="true"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close ticket details">
          <X size={22} strokeWidth={2.5} />
        </button>
        <img src={event.imageUrl} alt="" />
        <div className="ticket-modal-body">
          <div>
            <span className="status-pill inline">{event.status}</span>
            <h2 id="ticket-detail-title">{event.name}</h2>
            <p>{event.description}</p>
          </div>
          <dl className="ticket-facts">
            <Meta icon={<CalendarDays size={18} strokeWidth={2.5} />} label="Date" value={formatDate(event.date)} />
            <Meta icon={<Clock size={18} strokeWidth={2.5} />} label="Time" value={event.time} />
            <Meta icon={<MapPin size={18} strokeWidth={2.5} />} label="Venue" value={`${event.venue}, ${event.city}`} />
            <Meta icon={<UsersRound size={18} strokeWidth={2.5} />} label="Sold" value={`${soldPercent}% sold`} />
          </dl>
          <div className="capacity-bar" aria-label={`${soldPercent}% sold`}>
            <span style={{ width: `${soldPercent}%` }} />
          </div>
          <div className="ticket-tier-grid">
            {tiers.map(([name, price, detail]) => (
              <article className="ticket-tier" key={name}>
                <div>
                  <h3>{name}</h3>
                  <p>{detail}</p>
                </div>
                <strong>${price}</strong>
              </article>
            ))}
          </div>
          <button className="primary-button" type="button">
            Continue checkout
            <span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </section>
    </div>
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

function StateBlock({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <div className="state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}
