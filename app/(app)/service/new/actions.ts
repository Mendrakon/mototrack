'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bikeId = formData.get('bike_id') as string
  const intervalId = (formData.get('interval_id') as string) || null
  const serviceName = formData.get('service_name') as string
  const hoursAtService = parseFloat(formData.get('hours_at_service') as string)
  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string) || null

  await supabase.from('service_log').insert({
    bike_id: bikeId,
    interval_id: intervalId,
    service_name: serviceName,
    hours_at_service: hoursAtService,
    date,
    notes,
  })

  revalidatePath(`/bikes/${bikeId}`)
  redirect(`/bikes/${bikeId}`)
}
