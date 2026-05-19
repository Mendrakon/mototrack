'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getServiceStatuses } from '@/lib/calculations'
import BikeStats from './BikeStats'
import TemperatureCard from './TemperatureCard'
import GarageServiceStatus from './GarageServiceStatus'
import LoadChart from './LoadChart'
import SessionHistory from './SessionHistory'
import type { Bike, ServiceInterval, ServiceLogPartial } from '@/lib/types'

// Hardkodierte Werte bis ESP32 diese Felder sendet
const MOCK_CURRENT_TEMP = 72.5
const MOCK_MAX_TEMP = 94.0
const MOCK_AVG_TEMP = 78.3
const MOCK_FULL_THROTTLE = 38
const MOCK_PARTIAL_THROTTLE = 45
const MOCK_IDLE = 17
const MOCK_TOTAL_DISTANCE_KM = 1250.5

export interface HourSession {
  id: string
  bike_id: string
  hours_reported: number
  reported_at: string
}

interface Props {
  initialBike: Bike
  intervals: ServiceInterval[]
  logs: ServiceLogPartial[]
  sessions: HourSession[]
}

export default function GarageDashboardClient({ initialBike, intervals, logs, sessions: initialSessions }: Props) {
  const [bike, setBike] = useState(initialBike)
  const [sessions, setSessions] = useState(initialSessions)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('garage-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bikes', filter: `id=eq.${bike.id}` },
        (payload) => {
          setBike((prev) => ({ ...prev, ...(payload.new as Partial<Bike>) }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hour_sessions', filter: `bike_id=eq.${bike.id}` },
        (payload) => {
          setSessions((prev) => [payload.new as HourSession, ...prev.slice(0, 9)])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bike.id])

  const effectiveHours = (bike.hours_offset ?? 0) + bike.total_hours
  const statuses = getServiceStatuses(effectiveHours, intervals, logs)
  const lastSync = sessions[0]?.reported_at

  return (
    <div className="h-screen flex flex-col gap-3 p-5 bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{bike.name}</h1>
          {(bike.make || bike.model) && (
            <p className="text-[#666] text-base mt-0.5">
              {[bike.make, bike.model].filter(Boolean).join(' ')}
              {bike.year ? ` · ${bike.year}` : ''}
            </p>
          )}
        </div>
        <div className="text-right">
          {lastSync && (
            <p className="text-[#555] text-sm">
              Letzte Sync:{' '}
              <span className="text-[#777]">
                {new Date(lastSync).toLocaleString('de-AT', { timeStyle: 'short', dateStyle: 'short' })}
              </span>
            </p>
          )}
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[#666] text-xs">Live</span>
          </div>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <BikeStats
          totalHours={effectiveHours}
          maxTemp={MOCK_MAX_TEMP}
          totalDistanceKm={MOCK_TOTAL_DISTANCE_KM}
          totalFuelL={effectiveHours * 1.6}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col gap-3 min-h-0">
          <TemperatureCard
            currentTemp={MOCK_CURRENT_TEMP}
            maxTemp={MOCK_MAX_TEMP}
            avgTemp={MOCK_AVG_TEMP}
          />
          <LoadChart
            fullThrottle={MOCK_FULL_THROTTLE}
            partialThrottle={MOCK_PARTIAL_THROTTLE}
            idle={MOCK_IDLE}
          />
        </div>
        <div className="flex flex-col gap-3 min-h-0">
          <GarageServiceStatus statuses={statuses} />
          <SessionHistory sessions={sessions} />
        </div>
      </div>
    </div>
  )
}
