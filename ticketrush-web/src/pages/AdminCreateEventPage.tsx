import { ArrowLeft, CalendarDays, Clock, Clapperboard, ImagePlus, LayoutGrid, MapPin, Plus, Save, Ticket, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEvent, formatCurrency } from '../services/ticketRushApi'
import type { EventCategory, EventKind, SeatClass, SeatSectionInput, TicketStatus } from '../types'

const categories: EventCategory[] = ['Music', 'Sports', 'Theater', 'Festival', 'Workshop', 'Comedy']
const statuses: TicketStatus[] = ['Available', 'Almost Sold Out', 'Flash Sale']
const seatClasses: SeatClass[] = ['STANDARD', 'VIP', 'PREMIUM', 'DELUXE']

const initialSections: SeatSectionInput[] = [
  { name: 'VIP A', rowCount: 3, seatsPerRow: 12, seatClass: 'VIP', price: 2200000 },
  { name: 'Zone B', rowCount: 5, seatsPerRow: 14, seatClass: 'PREMIUM', price: 1450000 },
  { name: 'Zone C', rowCount: 6, seatsPerRow: 16, seatClass: 'STANDARD', price: 850000 },
]

type SoundtrackDraft = {
  title: string
  artist: string
  isrc?: string
  externalId?: string
}

export function AdminCreateEventPage() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<EventKind>('EVENT')
  const [name, setName] = useState('New TicketRush Listing')
  const [category, setCategory] = useState<EventCategory>('Music')
  const [status, setStatus] = useState<TicketStatus>('Flash Sale')
  const [date, setDate] = useState('2026-06-16')
  const [time, setTime] = useState('20:00')
  const [venue, setVenue] = useState('TicketRush Arena')
  const [city, setCity] = useState('Ha Noi')
  const [address, setAddress] = useState('99 Tran Duy Hung, Cau Giay, Ha Noi')
  const [description, setDescription] = useState('A new listing with a live seat map, queue-ready access, and QR ticket checkout.')
  const [imageUrl, setImageUrl] = useState('')
  const [isFlashSale, setIsFlashSale] = useState(true)
  const [sections, setSections] = useState<SeatSectionInput[]>(initialSections)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [director, setDirector] = useState('Avery Stone')
  const [cast, setCast] = useState('Mira Vale, Theo Minh, Lina Tran')
  const [durationMinutes, setDurationMinutes] = useState(118)
  const [ageRating, setAgeRating] = useState('PG-13')
  const [trailerUrl, setTrailerUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ')
  const [genres, setGenres] = useState('Drama, Music, Adventure')
  const [cinemaName, setCinemaName] = useState('Galaxy Central')
  const [screenName, setScreenName] = useState('Screen 1')
  const [format, setFormat] = useState('IMAX')
  const [soundtracks, setSoundtracks] = useState<SoundtrackDraft[]>([
    { title: 'Opening Theme', artist: 'TicketRush Orchestra', externalId: 'acr-opening-theme', isrc: 'TROPEN2026' },
  ])

  const totalSeats = useMemo(() => sections.reduce((sum, section) => sum + section.rowCount * section.seatsPerRow, 0), [sections])
  const priceFrom = useMemo(() => {
    const min = Math.min(...sections.map((section) => section.price))
    return Number.isFinite(min) ? min : 0
  }, [sections])

  function updateSection(index: number, patch: Partial<SeatSectionInput>) {
    setSections((current) => current.map((section, sectionIndex) => (sectionIndex === index ? { ...section, ...patch } : section)))
  }

  function addSection() {
    setSections((current) => [
      ...current,
      { name: `Zone ${String.fromCharCode(65 + current.length)}`, rowCount: 3, seatsPerRow: 12, seatClass: 'STANDARD', price: 650000 },
    ])
  }

  function removeSection(index: number) {
    setSections((current) => current.filter((_, sectionIndex) => sectionIndex !== index))
  }

  function updateSoundtrack(index: number, patch: Partial<SoundtrackDraft>) {
    setSoundtracks((current) => current.map((track, trackIndex) => (trackIndex === index ? { ...track, ...patch } : track)))
  }

  function addSoundtrack() {
    setSoundtracks((current) => [...current, { title: 'New Soundtrack', artist: 'Unknown Artist', externalId: '', isrc: '' }])
  }

  function removeSoundtrack(index: number) {
    setSoundtracks((current) => current.filter((_, trackIndex) => trackIndex !== index))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const created = await createEvent({
        kind,
        name,
        category: kind === 'MOVIE' ? 'Cinema' : category,
        status,
        date,
        time,
        venue: kind === 'MOVIE' ? `${cinemaName} - ${screenName}` : venue,
        city,
        address,
        description,
        imageUrl,
        isFlashSale,
        sections,
        cinemaName,
        screenName,
        format,
        movie:
          kind === 'MOVIE'
            ? {
                director,
                cast: cast.split(',').map((item) => item.trim()).filter(Boolean),
                durationMinutes,
                ageRating,
                trailerUrl,
                genres: genres.split(',').map((item) => item.trim()).filter(Boolean),
                synopsis: description,
              }
            : undefined,
        soundtracks: kind === 'MOVIE' ? soundtracks.filter((track) => track.title.trim()) : undefined,
      })
      navigate(`/events/${created.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="admin-shell create-admin-shell" aria-labelledby="create-event-title">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          <Ticket size={24} />
          TicketRush
        </Link>
        <nav>
          <Link to="/admin">
            <ArrowLeft size={18} />
            Dashboard
          </Link>
          <Link className="active" to="/admin/events/new">
            <Plus size={18} />
            Create Listing
          </Link>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">
              <Plus size={18} strokeWidth={2.5} />
              Create Listing
            </p>
            <h1 id="create-event-title">Build a sale-ready event or movie.</h1>
          </div>
          <Link className="secondary-button compact-button" to="/admin">
            Back to dashboard
          </Link>
        </div>

        <form className="create-event-layout" onSubmit={onSubmit}>
          <section className="admin-card create-main-panel" aria-labelledby="event-basic-title">
            <div className="panel-heading">
              <div>
                <h2 id="event-basic-title">Listing details</h2>
                <p>Saved listings appear immediately on Explore Tickets.</p>
              </div>
            </div>

            <div className="kind-toggle" role="group" aria-label="Listing type">
              <button className={kind === 'EVENT' ? 'active' : ''} type="button" onClick={() => setKind('EVENT')}>
                <Ticket size={18} />
                Event
              </button>
              <button className={kind === 'MOVIE' ? 'active' : ''} type="button" onClick={() => setKind('MOVIE')}>
                <Clapperboard size={18} />
                Movie
              </button>
            </div>

            <div className="poster-uploader">
              <input id="poster-upload" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
              <label htmlFor="poster-upload">
                <ImagePlus size={34} strokeWidth={2.5} />
                <span>Poster URL</span>
                <small>Paste an image URL or use the default poster.</small>
              </label>
            </div>

            <div className="create-form-grid">
              <label className="field span-2">
                <span>Title</span>
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>

              <label className="field">
                <span>Category</span>
                <div className="select-shell">
                  <select value={kind === 'MOVIE' ? 'Cinema' : category} onChange={(event) => setCategory(event.target.value as EventCategory)} disabled={kind === 'MOVIE'} required>
                    {kind === 'MOVIE' ? <option>Cinema</option> : categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </label>

              <label className="field">
                <span>Status</span>
                <div className="select-shell">
                  <select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)} required>
                    {statuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="field">
                <span>Date</span>
                <div className="input-shell icon-field">
                  <CalendarDays size={20} strokeWidth={2.5} aria-hidden="true" />
                  <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
                </div>
              </label>

              <label className="field">
                <span>Start time</span>
                <div className="input-shell icon-field">
                  <Clock size={20} strokeWidth={2.5} aria-hidden="true" />
                  <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
                </div>
              </label>

              {kind === 'EVENT' ? (
                <label className="field">
                  <span>Venue</span>
                  <div className="input-shell icon-field">
                    <MapPin size={20} strokeWidth={2.5} aria-hidden="true" />
                    <input type="text" value={venue} onChange={(event) => setVenue(event.target.value)} required />
                  </div>
                </label>
              ) : (
                <>
                  <label className="field">
                    <span>Cinema</span>
                    <input type="text" value={cinemaName} onChange={(event) => setCinemaName(event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Screen</span>
                    <input type="text" value={screenName} onChange={(event) => setScreenName(event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Format</span>
                    <input type="text" value={format} onChange={(event) => setFormat(event.target.value)} required />
                  </label>
                </>
              )}

              <label className="field">
                <span>City</span>
                <input type="text" value={city} onChange={(event) => setCity(event.target.value)} required />
              </label>

              <label className="field span-2">
                <span>Address</span>
                <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} required />
              </label>

              <label className="field span-2">
                <span>Description</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
              </label>
            </div>
          </section>

          <aside className="admin-card create-side-panel" aria-labelledby="ticket-settings-title">
            <h2 id="ticket-settings-title">Sale settings</h2>
            <label className="check-row terms-row">
              <input type="checkbox" checked={isFlashSale} onChange={(event) => setIsFlashSale(event.target.checked)} />
              <span>Enable virtual waiting room</span>
            </label>
            <div className="publish-card">
              <Ticket size={24} strokeWidth={2.5} />
              <div>
                <strong>{totalSeats} seats</strong>
                <span>From {formatCurrency(priceFrom)}</span>
              </div>
            </div>
          </aside>

          {kind === 'MOVIE' && (
            <section className="admin-card movie-admin-panel span-full" aria-labelledby="movie-admin-title">
              <div className="panel-heading">
                <div>
                  <h2 id="movie-admin-title">Movie metadata</h2>
                  <p>These fields power the movie detail page and soundtrack search results.</p>
                </div>
              </div>
              <div className="create-form-grid">
                <label className="field">
                  <span>Director</span>
                  <input value={director} onChange={(event) => setDirector(event.target.value)} />
                </label>
                <label className="field">
                  <span>Cast</span>
                  <input value={cast} onChange={(event) => setCast(event.target.value)} />
                </label>
                <label className="field">
                  <span>Runtime</span>
                  <input type="number" min={1} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
                </label>
                <label className="field">
                  <span>Age rating</span>
                  <input value={ageRating} onChange={(event) => setAgeRating(event.target.value)} />
                </label>
                <label className="field span-2">
                  <span>Trailer URL</span>
                  <input type="url" value={trailerUrl} onChange={(event) => setTrailerUrl(event.target.value)} />
                </label>
                <label className="field span-2">
                  <span>Genres</span>
                  <input value={genres} onChange={(event) => setGenres(event.target.value)} />
                </label>
              </div>

              <div className="soundtrack-editor">
                <div className="panel-heading compact">
                  <h3>Soundtracks</h3>
                  <button className="secondary-button compact-button" type="button" onClick={addSoundtrack}>
                    <Plus size={18} />
                    Add track
                  </button>
                </div>
                {soundtracks.map((track, index) => (
                  <article className="soundtrack-row" key={`${track.title}-${index}`}>
                    <input value={track.title} onChange={(event) => updateSoundtrack(index, { title: event.target.value })} aria-label="Soundtrack title" />
                    <input value={track.artist} onChange={(event) => updateSoundtrack(index, { artist: event.target.value })} aria-label="Soundtrack artist" />
                    <input value={track.externalId ?? ''} onChange={(event) => updateSoundtrack(index, { externalId: event.target.value })} aria-label="External ID" placeholder="External ID" />
                    <input value={track.isrc ?? ''} onChange={(event) => updateSoundtrack(index, { isrc: event.target.value })} aria-label="ISRC" placeholder="ISRC" />
                    <button className="tiny-icon-button" type="button" onClick={() => removeSoundtrack(index)} aria-label={`Remove ${track.title}`}>
                      <Trash2 size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="admin-card seat-map-panel span-full" aria-labelledby="seat-map-title">
            <div className="panel-heading">
              <div>
                <h2 id="seat-map-title">Seat matrix and pricing</h2>
                <p>Define sections, rows, seats per row, tier, and price.</p>
              </div>
              <LayoutGrid size={28} strokeWidth={2.5} />
            </div>

            <div className="seat-map-builder matrix-builder">
              <div className="seat-map-preview matrix-preview" aria-label="Seat matrix preview">
                <div className="stage">{kind === 'MOVIE' ? 'Screen' : 'Stage'}</div>
                {sections.map((section) => (
                  <div className={`matrix-zone ${section.seatClass.toLowerCase()}`} key={section.name}>
                    <strong>{section.name}</strong>
                    <span>
                      {section.rowCount} rows x {section.seatsPerRow} seats
                    </span>
                  </div>
                ))}
              </div>

              <div className="seat-section-list">
                {sections.map((section, index) => (
                  <article className="seat-section-row matrix-section-row" key={`${section.name}-${index}`}>
                    <label>
                      Section
                      <input type="text" value={section.name} onChange={(event) => updateSection(index, { name: event.target.value })} />
                    </label>
                    <label>
                      Rows
                      <input type="number" min={1} value={section.rowCount} onChange={(event) => updateSection(index, { rowCount: Number(event.target.value) })} />
                    </label>
                    <label>
                      Seats/row
                      <input type="number" min={1} value={section.seatsPerRow} onChange={(event) => updateSection(index, { seatsPerRow: Number(event.target.value) })} />
                    </label>
                    <label>
                      Tier
                      <select value={section.seatClass} onChange={(event) => updateSection(index, { seatClass: event.target.value as SeatClass })}>
                        {seatClasses.map((seatClass) => (
                          <option key={seatClass}>{seatClass}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Price
                      <input type="number" min={0} value={section.price} onChange={(event) => updateSection(index, { price: Number(event.target.value) })} />
                    </label>
                    <button className="tiny-icon-button" type="button" onClick={() => removeSection(index)} aria-label={`Remove ${section.name}`}>
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </article>
                ))}
                <button className="secondary-button add-section-button" type="button" onClick={addSection}>
                  <Plus size={18} strokeWidth={2.5} />
                  Add section
                </button>
              </div>
            </div>
          </section>

          <div className="create-actions span-full">
            <button className="secondary-button" type="button" onClick={() => navigate('/admin')}>
              Cancel
            </button>
            <button className="primary-button compact-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save listing'}
              <span>
                <Save size={18} strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </form>
      </main>
    </section>
  )
}
