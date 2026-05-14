import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getServiceStatuses } from '@/lib/calculations'
import ServiceIntervalCard from '@/components/ServiceIntervalCard'
import Link from 'next/link'
import type { ServiceLogPartial } from '@/lib/types'

export default async function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bike } = await supabase
    .from('bikes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bike) notFound()

  const { data: intervals } = await supabase
    .from('service_intervals')
    .select('*')
    .eq('bike_id', id)
    .order('created_at', { ascending: true })

  const intervalIds = (intervals ?? []).map((i) => i.id)
  const { data: logs } = intervalIds.length
    ? await supabase
        .from('service_log')
        .select('interval_id, hours_at_service, date')
        .in('interval_id', intervalIds)
    : { data: [] as ServiceLogPartial[] }

  const statuses = getServiceStatuses(bike.total_hours, intervals ?? [], logs ?? [])

  return (
    <main className="p-4 pb-4">
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
          href={`/bikes/${id}/settings`}
          className="text-[#888] text-sm border border-[#333] rounded-lg px-3 py-1.5"
        >
          Einstellungen
        </Link>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-5 mb-6 text-center">
        <p className="text-[#888] text-xs mb-1">Betriebsstunden</p>
        <p className="text-5xl font-bold text-white">{bike.total_hours.toFixed(1)}</p>
        <p className="text-[#888] text-sm mt-1">Stunden</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white">Service Intervalle</h2>
        <Link
          href={`/service/new?bike_id=${id}`}
          className="bg-[#ff6600] text-black text-xs font-semibold rounded-lg px-3 py-1.5"
        >
          Service eintragen
        </Link>
      </div>

      {statuses.length === 0 ? (
        <div className="text-center py-10 text-[#555]">
          <p className="mb-2 text-sm">Keine Service-Intervalle konfiguriert</p>
          <Link href={`/bikes/${id}/settings`} className="text-[#ff6600] text-sm">
            Intervalle hinzufügen →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {statuses.map((s) => (
            <ServiceIntervalCard key={s.name} status={s} />
          ))}
        </div>
      )}
    </main>
  )
}
