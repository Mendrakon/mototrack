export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import GarageDashboardClient from '@/components/garage/GarageDashboardClient'
import type { ServiceLogPartial } from '@/lib/types'

// Hier die echte Bike-UUID eintragen
const BIKE_ID = '0ebd36fe-3bd3-4ecd-9d8b-683f534bc60f'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function GaragePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  const garageToken = process.env.GARAGE_TOKEN
  if (garageToken && token !== garageToken) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-[#555] text-lg">Kein Zugriff</p>
      </div>
    )
  }

  const [{ data: bike }, { data: intervals }, { data: sessions }] = await Promise.all([
    supabase.from('bikes').select('*').eq('id', BIKE_ID).single(),
    supabase
      .from('service_intervals')
      .select('*')
      .eq('bike_id', BIKE_ID)
      .order('created_at', { ascending: true }),
    supabase
      .from('hour_sessions')
      .select('*')
      .eq('bike_id', BIKE_ID)
      .order('reported_at', { ascending: false })
      .limit(10),
  ])

  if (!bike) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-[#555] text-lg">Bike nicht gefunden</p>
      </div>
    )
  }

  const intervalIds = (intervals ?? []).map((i: { id: string }) => i.id)
  const { data: logs } = intervalIds.length
    ? await supabase
        .from('service_log')
        .select('interval_id, hours_at_service, date')
        .in('interval_id', intervalIds)
    : { data: [] as ServiceLogPartial[] }

  return (
    <GarageDashboardClient
      initialBike={bike}
      intervals={intervals ?? []}
      logs={logs ?? []}
      sessions={sessions ?? []}
    />
  )
}
