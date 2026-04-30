import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ImagePlus,
  LayoutGrid,
  MapPin,
  Plus,
  Save,
  Ticket,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createEvent } from '../services/ticketRushApi'
import type { EventCategory, TicketStatus } from '../types'

type SeatTemplate = 'concert' | 'theater' | 'stadium'

type SeatSection = {
  name: string
  capacity: number
  price: number
  tone: string
}

const seatTemplates: Record<SeatTemplate, SeatSection[]> = {
  concert: [
    { name: 'VIP Floor', capacity: 180, price: 158, tone: 'vip wide' },
    { name: 'Reserved A', capacity: 420, price: 98, tone: 'reserved' },
    { name: 'Reserved B', capacity: 680, price: 74, tone: 'standard' },
    { name: 'Balcony', capacity: 520, price: 46, tone: 'balcony' },
  ],
  theater: [
    { name: 'Orchestra', capacity: 260, price: 118, tone: 'vip' },
    { name: 'Mezzanine', capacity: 340, price: 82, tone: 'reserved' },
    { name: 'Dress Circle', capacity: 240, price: 64, tone: 'standard' },
    { name: 'Gallery', capacity: 180, price: 42, tone: 'balcony' },
  ],
  stadium: [
    { name: 'Pitch Side', capacity: 900, price: 132, tone: 'vip wide' },
    { name: 'Lower Bowl', capacity: 4200, price: 86, tone: 'reserved wide' },
    { name: 'Upper Bowl East', capacity: 3600, price: 54, tone: 'standard' },
    { name: 'Upper Bowl West', capacity: 3600, price: 54, tone: 'standard' },
    { name: 'Supporters', capacity: 1800, price: 38, tone: 'balcony wide' },
  ],
}

export function AdminCreateEventPage() {
  const [seatTemplate, setSeatTemplate] = useState<SeatTemplate>('concert')
  const [eventName, setEventName] = useState('')
  const [category, setCategory] = useState<EventCategory>('Music')
  const [status, setStatus] = useState<TicketStatus>('Available')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('Ho Chi Minh City')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const seatSections = useMemo(() => seatTemplates[seatTemplate], [seatTemplate])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setNotice(null)
    try {
      await createEvent({
        kind: 'EVENT',
        name: eventName.trim(),
        category,
        status,
        date,
        time,
        venue: venue.trim(),
        city: city.trim(),
        address: address.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        isFlashSale: status === 'Flash Sale',
        sections: seatSections.map((section) => ({
          name: section.name,
          rowCount: Math.max(1, Math.floor(section.capacity / 12)),
          seatsPerRow: 12,
          seatClass: section.name.toLowerCase().includes('vip') ? 'VIP' : section.name.toLowerCase().includes('balcony') ? 'STANDARD' : 'PREMIUM',
          price: section.price * 1000,
        })),
      })
      setNotice({ tone: 'success', text: 'Event created successfully via backend API.' })
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Failed to create event via API.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="create-event-page" aria-labelledby="create-event-title">
      <div className="admin-hero create-hero">
        <div>
          <p className="eyebrow">
            <Plus size={18} strokeWidth={2.5} />
            Create event
          </p>
          <h1 id="create-event-title">Build the next ticket drop.</h1>
        </div>
        <Link className="secondary-button compact-link" to="/admin">
          <ArrowLeft size={18} strokeWidth={2.5} />
          Back to dashboard
        </Link>
      </div>

      <form className="create-event-layout" onSubmit={onSubmit}>
        <section className="admin-panel create-main-panel" aria-labelledby="event-basic-title">
          <div className="panel-heading">
            <div>
              <h2 id="event-basic-title">Event details</h2>
              <p>Core listing information customers will see.</p>
            </div>
          </div>

          <div className="poster-uploader">
            <input id="poster-upload" type="file" accept="image/*" />
            <label htmlFor="poster-upload">
              <ImagePlus size={34} strokeWidth={2.5} />
              <span>Choose poster image</span>
              <small>PNG, JPG, or WebP. Recommended 4:5 poster ratio.</small>
            </label>
          </div>

          <div className="create-form-grid">
            <label className="field span-2">
              <span>Event name</span>
              <input type="text" placeholder="Neon Sunset Live" value={eventName} onChange={(event) => setEventName(event.target.value)} required />
            </label>

            <label className="field">
              <span>Category</span>
              <div className="select-shell">
                <select value={category} onChange={(event) => setCategory(event.target.value as EventCategory)} required>
                  <option value="Music">Music</option>
                  <option value="Sports">Sports</option>
                  <option value="Theater">Theater</option>
                  <option value="Festival">Festival</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Comedy">Comedy</option>
                </select>
              </div>
            </label>

            <label className="field">
              <span>Status</span>
              <div className="select-shell">
                <select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)} required>
                  <option value="Available">Available</option>
                  <option value="Flash Sale">Flash Sale</option>
                  <option value="Almost Sold Out">Almost Sold Out</option>
                  <option value="Sold Out">Sold Out</option>
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

            <label className="field span-2">
              <span>Venue</span>
              <div className="input-shell icon-field">
                <MapPin size={20} strokeWidth={2.5} aria-hidden="true" />
                <input type="text" placeholder="Pulse Hall, Austin TX" value={venue} onChange={(event) => setVenue(event.target.value)} required />
              </div>
            </label>

            <label className="field">
              <span>City</span>
              <input type="text" value={city} onChange={(event) => setCity(event.target.value)} required />
            </label>

            <label className="field">
              <span>Address</span>
              <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} required />
            </label>

            <label className="field span-2">
              <span>Poster URL</span>
              <input type="url" placeholder="https://..." value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
            </label>

            <label className="field span-2">
              <span>Description</span>
              <textarea
                placeholder="Describe the event experience, lineup, entry policy, and highlights."
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>
        </section>

        <aside className="admin-panel create-side-panel" aria-labelledby="ticket-settings-title">
          <h2 id="ticket-settings-title">Ticket settings</h2>

          <label className="field">
            <span>Total ticket cap</span>
            <input type="number" defaultValue={1800} min={1} />
          </label>

          <label className="field">
            <span>Sale opens</span>
            <input type="datetime-local" />
          </label>

          <label className="field">
            <span>Per order limit</span>
            <input type="number" defaultValue={6} min={1} />
          </label>

          <div className="publish-card">
            <Ticket size={24} strokeWidth={2.5} />
            <div>
              <strong>Ready for backend</strong>
              <span>Submit can post event, poster, seats, and pricing payload.</span>
            </div>
          </div>
        </aside>

        <section className="admin-panel seat-map-panel" aria-labelledby="seat-map-title">
          <div className="panel-heading">
            <div>
              <h2 id="seat-map-title">Seat map & pricing</h2>
              <p>Choose a default layout or sketch a custom map for the venue.</p>
            </div>
            <LayoutGrid size={28} strokeWidth={2.5} />
          </div>

          <div className="seat-template-picker" role="radiogroup" aria-label="Seat map templates">
            <button
              className={seatTemplate === 'concert' ? 'active' : ''}
              type="button"
              role="radio"
              aria-checked={seatTemplate === 'concert'}
              onClick={() => setSeatTemplate('concert')}
            >
              Concert hall
            </button>
            <button
              className={seatTemplate === 'theater' ? 'active' : ''}
              type="button"
              role="radio"
              aria-checked={seatTemplate === 'theater'}
              onClick={() => setSeatTemplate('theater')}
            >
              Theater
            </button>
            <button
              className={seatTemplate === 'stadium' ? 'active' : ''}
              type="button"
              role="radio"
              aria-checked={seatTemplate === 'stadium'}
              onClick={() => setSeatTemplate('stadium')}
            >
              Stadium
            </button>
            <Link className="secondary-button compact-link" to="/admin/events/new/seat-map">
              Create new map
            </Link>
          </div>

          <div className="seat-map-builder">
            <div className={`seat-map-preview ${seatTemplate}`} aria-label="Seat map preview">
              <div className="stage">Stage</div>
              {seatSections.map((section) => (
                <button className={`seat-zone ${section.tone}`} type="button" key={section.name}>
                  <strong>{section.name}</strong>
                  <span>{section.capacity} seats</span>
                </button>
              ))}
            </div>

            <div className="seat-section-list">
              {seatSections.map((section) => (
                <article className="seat-section-row" key={section.name}>
                  <div>
                    <strong>{section.name}</strong>
                    <span>{section.capacity} tickets</span>
                  </div>
                  <label>
                    Price
                    <input type="number" defaultValue={section.price} min={0} />
                  </label>
                  <label>
                    Quantity
                    <input type="number" defaultValue={section.capacity} min={0} />
                  </label>
                </article>
              ))}
              <button className="secondary-button add-section-button" type="button">
                <Plus size={18} strokeWidth={2.5} />
                Add section
              </button>
            </div>
          </div>
        </section>

        <div className="create-actions">
          {notice && (
            <div className={`auth-notice ${notice.tone}`} role="status" aria-live="polite">
              <span className="auth-notice-icon">
                {notice.tone === 'success' ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <AlertCircle size={18} strokeWidth={2.5} />}
              </span>
              <p>{notice.text}</p>
            </div>
          )}
          <button className="secondary-button" type="button">
            Save draft
          </button>
          <button className="primary-button compact-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Publish event'}
            <span>
              <Save size={18} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </form>
    </section>
  )
}
