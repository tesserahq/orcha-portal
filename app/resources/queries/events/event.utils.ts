import { endOfDay, format, parse, startOfDay } from 'date-fns'

/** Calendar-day format used in the URL for the created_at filter dates. */
export const EVENT_FILTER_DATE_FORMAT = 'yyyy-MM-dd'

/** Query params the events list endpoint accepts for filtering. */
export type EventFilterParams = {
  event_type?: string
  created_from?: string
  created_to?: string
}

/** Parse a `yyyy-MM-dd` URL value as a local calendar day. Returns undefined when invalid. */
export const parseEventFilterDate = (value: string | null): Date | undefined => {
  if (!value) return undefined

  const parsed = parse(value, EVENT_FILTER_DATE_FORMAT, new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export const formatEventFilterDate = (date: Date): string => format(date, EVENT_FILTER_DATE_FORMAT)

/**
 * Return a copy of `current` with `changes` applied.
 * An undefined or empty value removes that key.
 */
export const withEventFilterParams = (
  current: URLSearchParams,
  changes: Record<string, string | undefined>
): URLSearchParams => {
  const next = new URLSearchParams(current)

  Object.entries(changes).forEach(([key, value]) => {
    if (value) {
      next.set(key, value)
      return
    }
    next.delete(key)
  })

  return next
}

/**
 * Convert the filter values in the URL into API query params.
 *
 * Dates are local calendar days. `created_from` is the start of its day and
 * `created_to` the end of its day, both sent as UTC instants, so the range is
 * inclusive of the whole selected days.
 */
export const toEventFilterParams = (searchParams: URLSearchParams): EventFilterParams => {
  const from = parseEventFilterDate(searchParams.get('created_from'))
  const to = parseEventFilterDate(searchParams.get('created_to'))

  return {
    event_type: searchParams.get('event_type')?.trim() || undefined,
    created_from: from ? startOfDay(from).toISOString() : undefined,
    created_to: to ? endOfDay(to).toISOString() : undefined,
  }
}
