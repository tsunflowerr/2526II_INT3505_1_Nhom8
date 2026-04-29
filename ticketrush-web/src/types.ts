export type EventCategory =
  | 'Concert'
  | 'Sports'
  | 'Theater'
  | 'Festival'
  | 'Workshop'
  | 'Comedy'

export type TicketStatus = 'Selling fast' | 'Available' | 'Few left'

export type EventItem = {
  id: string
  name: string
  category: EventCategory
  date: string
  time: string
  venue: string
  city: string
  priceFrom: number
  imageUrl: string
  status: TicketStatus
  tags: string[]
}
