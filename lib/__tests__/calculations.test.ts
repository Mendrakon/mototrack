import { describe, it, expect } from 'vitest'
import { calculateServiceStatus, getServiceStatuses, getWorstStatus } from '../calculations'

describe('calculateServiceStatus', () => {
  it('returns ok when less than 80% of interval reached', () => {
    // Intervall 40h, letzter Service bei 0h, aktuell 30h → 75%
    const result = calculateServiceStatus('Ölwechsel', 40, 0, 30)
    expect(result.status).toBe('ok')
    expect(result.percentageDue).toBe(75)
    expect(result.hoursUntilNext).toBe(10)
    expect(result.hoursOverdue).toBe(0)
  })

  it('returns soon when 80–100% of interval reached', () => {
    // Intervall 40h, letzter Service bei 10h, aktuell 42h → 80%
    const result = calculateServiceStatus('Ölwechsel', 40, 10, 42)
    expect(result.status).toBe('soon')
    expect(result.percentageDue).toBe(80)
    expect(result.hoursUntilNext).toBe(8)
    expect(result.hoursOverdue).toBe(0)
  })

  it('returns overdue when over 100% of interval reached', () => {
    // Aus CLAUDE.md: Intervall 40h, letzter bei 10h, aktuell 55h → 112.5%
    const result = calculateServiceStatus('Ölwechsel', 40, 10, 55)
    expect(result.status).toBe('overdue')
    expect(result.percentageDue).toBe(112.5)
    expect(result.hoursOverdue).toBe(5)
    expect(result.hoursUntilNext).toBe(-5)
  })

  it('returns exactly ok at 79.9%', () => {
    const result = calculateServiceStatus('Test', 100, 0, 79.9)
    expect(result.status).toBe('ok')
  })

  it('returns exactly soon at 80%', () => {
    const result = calculateServiceStatus('Test', 100, 0, 80)
    expect(result.status).toBe('soon')
  })

  it('returns exactly overdue at 100%', () => {
    const result = calculateServiceStatus('Test', 100, 0, 100)
    expect(result.status).toBe('overdue')
  })
})

describe('getWorstStatus', () => {
  it('returns overdue if any status is overdue', () => {
    const statuses = [
      { status: 'ok' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
      { status: 'overdue' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
    ]
    expect(getWorstStatus(statuses)).toBe('overdue')
  })

  it('returns soon if any is soon and none overdue', () => {
    const statuses = [
      { status: 'ok' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
      { status: 'soon' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
    ]
    expect(getWorstStatus(statuses)).toBe('soon')
  })

  it('returns ok if all are ok', () => {
    const statuses = [
      { status: 'ok' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
    ]
    expect(getWorstStatus(statuses)).toBe('ok')
  })

  it('returns ok for empty array', () => {
    expect(getWorstStatus([])).toBe('ok')
  })
})

describe('getServiceStatuses', () => {
  it('uses 0 as last service hours when no log entry exists for an interval', () => {
    const intervals = [{ id: 'a', name: 'Ölwechsel', interval_hours: 40 }]
    const logs: { interval_id: string | null; hours_at_service: number; date: string }[] = []
    const statuses = getServiceStatuses(42.5, intervals, logs)
    expect(statuses[0].lastServiceHours).toBe(0)
    expect(statuses[0].percentageDue).toBeCloseTo(106.25)
    expect(statuses[0].status).toBe('overdue')
  })

  it('uses the most recent log entry for each interval', () => {
    const intervals = [{ id: 'a', name: 'Ölwechsel', interval_hours: 40 }]
    const logs = [
      { interval_id: 'a', hours_at_service: 0, date: '2025-01-01' },
      { interval_id: 'a', hours_at_service: 40, date: '2025-06-01' }, // newer
    ]
    const statuses = getServiceStatuses(50, intervals, logs)
    expect(statuses[0].lastServiceHours).toBe(40) // uses the newer entry
    expect(statuses[0].hoursUntilNext).toBe(30)
  })
})
