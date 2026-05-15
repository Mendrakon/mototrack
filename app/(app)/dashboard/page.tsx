export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getServiceStatuses, getWorstStatus } from '@/lib/calculations'
import BikeCard from '@/components/BikeCard'
import type { ServiceLogPartial } from '@/lib/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bikes } = await supabase
    .from('bikes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!bikes || bikes.length === 0) {
    return (
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-6">Meine Bikes</h1>
        <div className="text-center py-16 text-[#555]">
          <p className="text-4xl mb-4">🏍️</p>
          <p className="mb-2">Noch keine Bikes</p>
          <Link href="/bikes/new" className="text-[#ff6600] text-sm">
            Erstes Bike hinzufügen →
          </Link>
        </div>
      </main>
    )
  }

  const bikeIds = bikes.map((b) => b.id)
  const { data: intervals } = await supabase
    .from('service_intervals')
    .select('*')
    .in('bike_id', bikeIds)

  const intervalIds = (intervals ?? []).map((i) => i.id)
  const { data: logs } = intervalIds.length
    ? await supabase
        .from('service_log')
        .select('interval_id, hours_at_service, date')
        .in('interval_id', intervalIds)
    : { data: [] as ServiceLogPartial[] }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Meine Bikes</h1>
      <div className="flex flex-col gap-3">
        {bikes.map((bike) => {
          const bikeIntervals = (intervals ?? []).filter((i) => i.bike_id === bike.id)
          const bikeLogs = (logs ?? []).filter((l) =>
            bikeIntervals.some((i) => i.id === l.interval_id)
          )
          const effectiveHours = (bike.hours_offset ?? 0) + bike.total_hours
          const statuses = getServiceStatuses(effectiveHours, bikeIntervals, bikeLogs)
          const worstStatus = statuses.length > 0 ? getWorstStatus(statuses) : undefined
          const nextService = statuses
            .filter((s) => s.status !== 'ok')
            .sort((a, b) => b.percentageDue - a.percentageDue)[0]

          return (
            <BikeCard
              key={bike.id}
              id={bike.id}
              name={bike.name}
              make={bike.make}
              model={bike.model}
              totalHours={effectiveHours}
              worstStatus={worstStatus}
              nextServiceName={nextService?.name}
            />
          )
        })}
      </div>
    </main>
  )
}
