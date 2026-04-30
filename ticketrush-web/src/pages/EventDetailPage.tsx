import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Clapperboard,
  LoaderCircle,
  MapPin,
  Music2,
  ShieldCheck,
  Ticket,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatCurrency, formatDate, getEvent, getShowtimesByEvent } from '../services/ticketRushApi'
import type { Showtime, TicketRushEvent } from '../types'

export function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<TicketRushEvent | null>(null)
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!eventId) return
      setIsLoading(true)
      const [eventDetail, eventShowtimes] = await Promise.all([getEvent(eventId), getShowtimesByEvent(eventId)])
      if (cancelled) return
      setEvent(eventDetail ?? null)
      setShowtimes(eventShowtimes)
      setIsLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [eventId])

  if (isLoading) {
    return (
      <section className="state-page">
        <div className="state-block">
          <div className="state-icon">
            <LoaderCircle className="spin" size={34} strokeWidth={2.5} />
          </div>
          <h1>Loading listing</h1>
          <p>TicketRush is preparing showtimes and live seat inventory.</p>
        </div>
      </section>
    )
  }

  if (!event) {
    return (
      <section className="state-page">
        <div className="state-block">
          <h1>Listing not found</h1>
          <p>This event or movie is not available in the mock catalog.</p>
          <Link className="secondary-button" to="/">
            <ArrowLeft size={18} strokeWidth={2.5} />
            Back to Explore
          </Link>
        </div>
      </section>
    )
  }

  const soldPercent = Math.round((event.sold / event.capacity) * 100)

  return (
    <section className="event-detail-page" aria-labelledby="event-detail-title">
      <Link className="secondary-button compact-link" to="/">
        <ArrowLeft size={18} strokeWidth={2.5} />
        Explore Tickets
      </Link>

      <article className="event-detail-hero">
        <div className="event-detail-poster">
          <img src={event.imageUrl} alt="" />
          <span className="status-pill">{event.status}</span>
        </div>

        <div className="event-detail-info">
          <p className="eyebrow">
            {event.kind === 'MOVIE' ? <Clapperboard size={18} strokeWidth={2.5} /> : <Ticket size={18} strokeWidth={2.5} />}
            {event.kind === 'MOVIE' ? 'Movie Ticketing' : event.category}
          </p>
          <h1 id="event-detail-title">{event.name}</h1>
          <p className="hero-text">{event.description}</p>

          <dl className="featured-meta">
            <Meta icon={<CalendarDays size={18} strokeWidth={2.5} />} label="Date" value={formatDate(event.date)} />
            <Meta icon={<Clock size={18} strokeWidth={2.5} />} label="Time" value={event.time} />
            <Meta icon={<MapPin size={18} strokeWidth={2.5} />} label="Venue" value={`${event.venue}, ${event.city}`} />
            <Meta icon={<CircleDollarSign size={18} strokeWidth={2.5} />} label="From" value={formatCurrency(event.priceFrom)} />
          </dl>

          <div className="detail-progress">
            <div>
              <strong>{soldPercent}%</strong>
              <span>sold or held</span>
            </div>
            <div className="capacity-bar" aria-label={`${soldPercent}% sold`}>
              <span style={{ width: `${soldPercent}%` }} />
            </div>
            <p>
              {event.sold}/{event.capacity} seats are currently sold or locked.
            </p>
          </div>
        </div>
      </article>

      {event.kind === 'MOVIE' && event.movie && (
        <section className="movie-detail-grid" aria-label="Movie details">
          <div className="admin-card trailer-card">
            <div className="trailer-frame">
              <iframe title={`${event.name} trailer`} src={event.movie.trailerUrl} allowFullScreen />
            </div>
          </div>
          <div className="admin-card movie-meta-card">
            <h2>Movie profile</h2>
            <p>{event.movie.synopsis}</p>
            <dl className="movie-facts">
              <Meta icon={<Clapperboard size={18} />} label="Director" value={event.movie.director} />
              <Meta icon={<Clock size={18} />} label="Runtime" value={`${event.movie.durationMinutes} min`} />
              <Meta icon={<ShieldCheck size={18} />} label="Rating" value={event.movie.ageRating} />
              <Meta icon={<UsersRound size={18} />} label="Cast" value={event.movie.cast.join(', ')} />
            </dl>
            <div className="tag-row">
              {event.movie.genres.map((genre) => (
                <span className="chip" key={genre}>
                  {genre}
                </span>
              ))}
            </div>
          </div>
          <div className="admin-card soundtrack-card">
            <h2>
              <Music2 size={22} />
              Soundtracks
            </h2>
            <div className="soundtrack-list">
              {(event.soundtracks ?? []).map((track) => (
                <span key={track.id}>
                  {track.title} · {track.artist}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="admin-card showtime-panel" aria-labelledby="showtime-title">
        <div className="panel-heading">
          <div>
            <h2 id="showtime-title">{event.kind === 'MOVIE' ? 'Cinema showtimes' : 'Available showtimes'}</h2>
            <p>Choose a showtime to enter the waiting room or open the live seat map.</p>
          </div>
          <ShieldCheck size={28} strokeWidth={2.5} />
        </div>

        <div className="showtime-grid">
          {showtimes.map((showtime) => (
            <article className="showtime-card" key={showtime.id}>
              <div>
                <strong>{formatDate(event.date)}</strong>
                <span>{event.time}</span>
              </div>
              <p>{event.kind === 'MOVIE' ? `${showtime.cinemaName} · ${showtime.screenName} · ${showtime.format}` : showtime.seatMapName}</p>
              <button
                className="primary-button compact-button"
                type="button"
                onClick={() => navigate(event.isFlashSale ? `/queue/${showtime.id}` : `/showtimes/${showtime.id}/seats`)}
              >
                Book Seats
                <span>
                  <UsersRound size={18} strokeWidth={2.5} />
                </span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
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
