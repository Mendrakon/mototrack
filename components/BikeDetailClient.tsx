'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getServiceStatuses } from '@/lib/calculations'
import ServiceIntervalCard from '@/components/ServiceIntervalCard'
import ServiceHistory from '@/components/ServiceHistory'
import BackButton from '@/components/BackButton'
import type { Bike, ServiceInterval, ServiceLog, ServiceLogPartial } from '@/lib/types'

interface Props {
  initialBike: Bike
  intervals: ServiceInterval[]
  logs: ServiceLogPartial[]
  allLogs: ServiceLog[]
}

export default function BikeDetailClient({ initialBike, intervals, logs, allLogs }: Props) {
  const [bike, setBike] = useState(initialBike)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`bike-${bike.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bikes', filter: `id=eq.${bike.id}` },
        (payload) => {
          setBike((prev) => ({ ...prev, ...(payload.new as Partial<Bike>) }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bike.id])

  const effectiveHours = (bike.hours_offset ?? 0) + bike.total_hours
  const statuses = getServiceStatuses(effectiveHours, intervals, logs)

  return (
    <main className="p-4 pb-4">
      <BackButton />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{bike.name}</h1>
          {(bike.make || bike.model) && (
            <p className="text-[#888] text-sm">
              {[bike.make, bike.model].filter(Boolean).join(' ')}
              {bike.year ? ` · ${bike.year}` : ''}
            </p>
          )}
        </div>
        <Link
          href={`/bikes/${bike.id}/settings`}
          className="text-[#888] text-sm border border-[#333] rounded-lg px-3 py-1.5"
        >
          Einstellungen
        </Link>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-5 mb-6 text-center">
        <p className="text-[#888] text-xs mb-1">Betriebsstunden</p>
        <p className="text-5xl font-bold text-white">{effectiveHours.toFixed(2)}</p>
        <p className="text-[#888] text-sm mt-1">Stunden</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white">Service Intervalle</h2>
        <Link
          href={`/service/new?bike_id=${bike.id}`}
          className="bg-[#ff6600] text-black text-xs font-semibold rounded-lg px-3 py-1.5"
        >
          Service eintragen
        </Link>
      </div>

      {statuses.length === 0 ? (
        <div className="text-center py-10 text-[#555]">
          <p className="mb-2 text-sm">Keine Service-Intervalle konfiguriert</p>
          <Link href={`/bikes/${bike.id}/settings`} className="text-[#ff6600] text-sm">
            Intervalle hinzufügen →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {statuses.map((s) => (
            <ServiceIntervalCard key={s.name} status={s} bikeId={bike.id} />
          ))}
        </div>
      )}

      <ServiceHistory logs={allLogs} />
    </main>
  )
}
