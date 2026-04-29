import { listEvents } from './ticketRushApi'
import type { EventItem } from '../types'

export async function fetchEvents(): Promise<EventItem[]> {
  return listEvents()
}
