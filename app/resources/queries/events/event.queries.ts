import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { EventType } from './event.type'

const EVENTS_ENDPOINT = '/events'

/**
 * Get all events
 */
export async function getEvents(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<EventType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size, q } = params

  const events = await fetchApi(`${apiUrl}${EVENTS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
    params: { q },
  })

  return events as IPaging<EventType>
}

/**
 * Get a single event by ID
 */
export async function getEvent(config: IQueryConfig, id: string): Promise<EventType> {
  const { apiUrl, token, nodeEnv } = config

  const event = await fetchApi(`${apiUrl}${EVENTS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return event as EventType
}

/**
 * Delete an event by ID
 */
export async function deleteEvent(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${EVENTS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}
