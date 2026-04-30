import { ArrowLeft, LoaderCircle, ShieldCheck, Ticket, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEvent, getQueueStatus, getShowtime, joinQueue } from '../services/ticketRushApi'
import type { QueueSession, Showtime, TicketRushEvent } from '../types'

export function WaitingRoomPage() {
  const { showtimeId } = useParams()
  const navigate = useNavigate()
  const [queue, setQueue] = useState<QueueSession | null>(null)
  const [event, setEvent] = useState<TicketRushEvent | null>(null)
  const [showtime, setShowtime] = useState<Showtime | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!showtimeId) return
      const currentShowtime = await getShowtime(showtimeId)
      if (!currentShowtime) return
      const [currentEvent, session] = await Promise.all([getEvent(currentShowtime.eventId), joinQueue(showtimeId)])
      if (cancelled) return
      setShowtime(currentShowtime)
      setEvent(currentEvent ?? null)
      setQueue(session)
    })()

    return () => {
      cancelled = true
    }
  }, [showtimeId])

  useEffect(() => {
    if (!queue) return

    const timer = window.setInterval(async () => {
      const nextQueue = await getQueueStatus(queue.token)
      if (!nextQueue) return
      setQueue(nextQueue)
      if (nextQueue.accessGranted) {
        window.clearInterval(timer)
        window.setTimeout(() => navigate(`/showtimes/${nextQueue.showtimeId}/seats?access=${nextQueue.accessToken}`), 700)
      }
    }, 1400)

    return () => window.clearInterval(timer)
  }, [navigate, queue])

  const progress = queue ? Math.max(0, Math.min(100, 100 - (queue.position / 170) * 100)) : 0

  return (
    <section className="waiting-page" aria-labelledby="waiting-title">
      <Link className="secondary-button compact-link" to={event ? `/events/${event.id}` : '/'}>
        <ArrowLeft size={18} strokeWidth={2.5} />
        Back to listing
      </Link>

      <div className="waiting-layout">
        <div className="waiting-copy">
          <p className="eyebrow">
            <UsersRound size={18} strokeWidth={2.5} />
            Virtual Waiting Room
          </p>
          <h1 id="waiting-title">You are in the TicketRush queue.</h1>
          <p className="hero-text">Access is released in batches to protect the seat database during flash sale traffic. Keep this page open.</p>
        </div>

        <section className="waiting-card" aria-live="polite">
          <span className="form-icon">
            {queue?.accessGranted ? <Ticket size={28} strokeWidth={2.5} /> : <LoaderCircle className="spin" size={28} strokeWidth={2.5} />}
          </span>
          <div>
            <p>{event?.name ?? 'Preparing listing'}</p>
            <h2>{queue?.accessGranted ? 'Your access is ready' : `Position #${queue?.position ?? '...'}`}</h2>
            <span>{showtime?.venue ?? 'TicketRush venue'}</span>
          </div>

          <div className="queue-progress" aria-label={`${Math.round(progress)}% queue progress`}>
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="waiting-facts">
            <div>
              <strong>{queue?.batchSize ?? 50}</strong>
              <span>people / batch</span>
            </div>
            <div>
              <strong>{queue?.accessGranted ? 'READY' : 'LIVE'}</strong>
              <span>access state</span>
            </div>
          </div>

          <div className="auth-note">
            <ShieldCheck size={18} strokeWidth={2.5} />
            Do not refresh this page while waiting.
          </div>
        </section>
      </div>
    </section>
  )
}
