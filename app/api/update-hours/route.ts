import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { api_key, total_hours } = body as { api_key?: unknown; total_hours?: unknown }

  if (typeof api_key !== 'string' || typeof total_hours !== 'number') {
    return NextResponse.json({ error: 'Missing api_key or total_hours' }, { status: 400 })
  }

  const { data: bike, error: findError } = await supabase
    .from('bikes')
    .select('id, total_hours')
    .eq('api_key', api_key)
    .single()

  if (findError || !bike) {
    return NextResponse.json({ error: 'Invalid api_key' }, { status: 401 })
  }

  if (total_hours <= bike.total_hours) {
    return NextResponse.json({ success: true, bike_id: bike.id, hours_updated: bike.total_hours })
  }

  const { error: updateError } = await supabase
    .from('bikes')
    .update({ total_hours })
    .eq('id', bike.id)

  if (updateError) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  await supabase.from('hour_sessions').insert({
    bike_id: bike.id,
    hours_reported: total_hours,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/bikes/${bike.id}`)

  return NextResponse.json({ success: true, bike_id: bike.id, hours_updated: total_hours })
}
