import type { ServiceInterval, ServiceLogPartial } from './types'

export interface ServiceStatus {
  intervalId: string
  name: string
  intervalHours: number
  lastServiceHours: number
  currentHours: number
  hoursUntilNext: number
  hoursOverdue: number
  percentageDue: number
  status: 'ok' | 'soon' | 'overdue'
}

export function calculateServiceStatus(
  intervalId: string,
  name: string,
  intervalHours: number,
  lastServiceHours: number,
  currentHours: number
): ServiceStatus {
  const hoursUntilNext = lastServiceHours + intervalHours - currentHours
  const hoursOverdue = hoursUntilNext < 0 ? Math.abs(hoursUntilNext) : 0
  const percentageDue = ((currentHours - lastServiceHours) / intervalHours) * 100
  const status: 'ok' | 'soon' | 'overdue' =
    percentageDue >= 100 ? 'overdue' : percentageDue >= 80 ? 'soon' : 'ok'
  return { intervalId, name, intervalHours, lastServiceHours, currentHours, hoursUntilNext, hoursOverdue, percentageDue, status }
}

export function getWorstStatus(statuses: ServiceStatus[]): 'ok' | 'soon' | 'overdue' {
  if (statuses.some(s => s.status === 'overdue')) return 'overdue'
  if (statuses.some(s => s.status === 'soon')) return 'soon'
  return 'ok'
}

export function getServiceStatuses(
  currentHours: number,
  intervals: ServiceInterval[],
  logs: ServiceLogPartial[]
): ServiceStatus[] {
  return intervals.map((interval) => {
    const intervalLogs = logs
      .filter((l) => l.interval_id === interval.id)
      .sort((a, b) => b.hours_at_service - a.hours_at_service)
    // No log → start tracking from currentHours (fresh interval, not retroactively overdue)
    const lastServiceHours = intervalLogs[0]?.hours_at_service ?? currentHours
    return calculateServiceStatus(interval.id, interval.name, interval.interval_hours, lastServiceHours, currentHours)
  })
}
