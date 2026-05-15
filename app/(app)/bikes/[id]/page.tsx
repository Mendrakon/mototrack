export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import BikeDetailClient from '@/components/BikeDetailClient'
import type { ServiceLog, ServiceLogPartial } from '@/lib/types'

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

  const { data: allLogs } = await supabase
    .from('service_log')
    .select('*')
    .eq('bike_id', id)
    .order('date', { ascending: false })

  return (
    <BikeDetailClient
      initialBike={bike}
      intervals={intervals ?? []}
      logs={logs ?? []}
      allLogs={(allLogs ?? []) as ServiceLog[]}
    />
  )
}
