import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { logService } from './actions'
import BackButton from '@/components/BackButton'

const inputClass =
  'bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#ff6600] w-full'

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ bike_id?: string; interval_id?: string }>
}) {
  const { bike_id, interval_id } = await searchParams
  if (!bike_id) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bike } = await supabase
    .from('bikes')
    .select('id, name, total_hours, hours_offset')
    .eq('id', bike_id)
    .eq('user_id', user.id)
    .single()

  if (!bike) notFound()

  const { data: intervals } = await supabase
    .from('service_intervals')
    .select('id, name')
    .eq('bike_id', bike_id)
    .order('created_at', { ascending: true })

  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-2">Service eintragen</h1>
      <p className="text-[#888] text-sm mb-6">{bike.name}</p>

      <form action={logService} className="flex flex-col gap-4">
        <input type="hidden" name="bike_id" value={bike_id} />

        {(intervals ?? []).length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#888]">Service Intervall (optional)</label>
            <select
              name="interval_id"
              defaultValue={interval_id ?? ''}
              className={`${inputClass} appearance-none`}
            >
              <option value="">– Kein Intervall –</option>
              {(intervals ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Service Bezeichnung *</label>
          <input
            name="service_name"
            type="text"
            placeholder="z.B. Ölwechsel"
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Stunden bei Service *</label>
          <input
            name="hours_at_service"
            type="number"
            step="0.01"
            min="0"
            defaultValue={((bike.hours_offset ?? 0) + bike.total_hours).toFixed(2)}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Datum *</label>
          <input
            name="date"
            type="date"
            defaultValue={today}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Notizen</label>
          <textarea
            name="notes"
            placeholder="Optional..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          className="bg-[#ff6600] text-black font-semibold rounded-lg py-3 text-sm mt-1"
        >
          Service speichern
        </button>
      </form>
    </main>
  )
}
