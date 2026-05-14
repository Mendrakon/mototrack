'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createBike(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const make = (formData.get('make') as string) || null
  const model = (formData.get('model') as string) || null
  const yearRaw = formData.get('year') as string
  const year = yearRaw ? parseInt(yearRaw, 10) : null

  const { data, error } = await supabase
    .from('bikes')
    .insert({
      user_id: user.id,
      name,
      make,
      model,
      year,
      api_key: crypto.randomUUID(),
    })
    .select('id')
    .single()

  if (error || !data) redirect('/dashboard')
  redirect(`/bikes/${data.id}`)
}
