'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function addInterval(bikeId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const intervalHours = parseFloat(formData.get('interval_hours') as string)

  const { error } = await supabase.from('service_intervals').insert({
    bike_id: bikeId,
    name,
    interval_hours: intervalHours,
  })

  if (error) console.error('addInterval error:', error)
  revalidatePath(`/bikes/${bikeId}/settings`)
}

export async function deleteInterval(intervalId: string, bikeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('service_intervals').delete().eq('id', intervalId)
  revalidatePath(`/bikes/${bikeId}/settings`)
}

export async function updateHoursOffset(bikeId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const newOffset = parseFloat(formData.get('hours_offset') as string)
  if (isNaN(newOffset) || newOffset < 0) return

  const { data: bike } = await supabase
    .from('bikes')
    .select('hours_offset')
    .eq('id', bikeId)
    .eq('user_id', user.id)
    .single()

  if (!bike) return

  const oldOffset = bike.hours_offset ?? 0
  const delta = newOffset - oldOffset

  await supabase
    .from('bikes')
    .update({ hours_offset: newOffset })
    .eq('id', bikeId)
    .eq('user_id', user.id)

  if (delta !== 0) {
    const { data: logs } = await supabase
      .from('service_log')
      .select('id, hours_at_service')
      .eq('bike_id', bikeId)

    if (logs && logs.length > 0) {
      await Promise.all(
        logs.map((log) =>
          supabase
            .from('service_log')
            .update({ hours_at_service: log.hours_at_service + delta })
            .eq('id', log.id)
        )
      )
    }
  }

  revalidatePath(`/bikes/${bikeId}`)
  revalidatePath(`/bikes/${bikeId}/settings`)
  revalidatePath('/dashboard')
}

export async function deleteBike(bikeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('bikes').delete().eq('id', bikeId).eq('user_id', user.id)
  redirect('/dashboard')
}
