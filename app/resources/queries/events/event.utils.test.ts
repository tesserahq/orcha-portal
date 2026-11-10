import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatEventFilterDate,
  parseEventFilterDate,
  toEventFilterParams,
  withEventFilterParams,
} from './event.utils'
import { endOfDay, startOfDay } from 'date-fns'

describe('event filter dates', () => {
  it('round-trips a yyyy-MM-dd value as a local day', () => {
    const parsed = parseEventFilterDate('2026-03-01')

    assert.ok(parsed)
    assert.equal(formatEventFilterDate(parsed), '2026-03-01')
  })

  it('returns undefined for missing or invalid values', () => {
    assert.equal(parseEventFilterDate(null), undefined)
    assert.equal(parseEventFilterDate(''), undefined)
    assert.equal(parseEventFilterDate('not-a-date'), undefined)
  })
})

describe('withEventFilterParams', () => {
  it('sets values and keeps unrelated params such as size', () => {
    const next = withEventFilterParams(new URLSearchParams('size=50&page=3'), {
      event_type: 'user.*',
      page: '1',
    })

    assert.equal(next.get('size'), '50')
    assert.equal(next.get('page'), '1')
    assert.equal(next.get('event_type'), 'user.*')
  })

  it('removes a key when the value is undefined or empty', () => {
    const next = withEventFilterParams(
      new URLSearchParams('event_type=user.*&created_from=2026-03-01'),
      {
        event_type: undefined,
        created_from: '',
      }
    )

    assert.equal(next.has('event_type'), false)
    assert.equal(next.has('created_from'), false)
  })

  it('does not mutate the input', () => {
    const current = new URLSearchParams('page=2')
    withEventFilterParams(current, { page: '1' })

    assert.equal(current.get('page'), '2')
  })
})

describe('toEventFilterParams', () => {
  it('trims the event type and omits it when blank', () => {
    assert.equal(
      toEventFilterParams(new URLSearchParams('event_type=%20user.*%20')).event_type,
      'user.*'
    )
    assert.equal(
      toEventFilterParams(new URLSearchParams('event_type=%20%20')).event_type,
      undefined
    )
    assert.equal(toEventFilterParams(new URLSearchParams()).event_type, undefined)
  })

  it('sends created_from as the start of its day and created_to as the end of its day', () => {
    const params = toEventFilterParams(
      new URLSearchParams('created_from=2026-03-01&created_to=2026-03-02')
    )

    assert.equal(params.created_from, startOfDay(new Date(2026, 2, 1)).toISOString())
    assert.equal(params.created_to, endOfDay(new Date(2026, 2, 2)).toISOString())
  })

  it('ignores invalid dates', () => {
    const params = toEventFilterParams(new URLSearchParams('created_from=bogus'))

    assert.equal(params.created_from, undefined)
  })
})
