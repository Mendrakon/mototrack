import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { addInterval, deleteInterval, deleteBike, updateHoursOffset } from './actions'
import BackButton from '@/components/BackButton'

const inputClass =
  'bg-[#111] border border-[#333] text-white placeholder-[#555] rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-[#ff6600]'

export default async function BikeSettingsPage({
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

  const addIntervalWithId = addInterval.bind(null, id)
  const deleteBikeWithId = deleteBike.bind(null, id)
  const updateOffsetWithId = updateHoursOffset.bind(null, id)

  return (
    <main className="p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>
      <p className="text-[#888] text-sm mb-6">{bike.name}</p>

      {/* API Key */}
      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">ESP32 API Key</h2>
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <p className="text-xs text-[#888] mb-2">
            Diesen Key in deinen ESP32 eintragen:
          </p>
          <code className="text-[#ff6600] text-xs break-all">{bike.api_key}</code>
        </div>
      </section>

      {/* Hours Offset */}
      <section className="mb-8">
        <h2 className="text-base font-semibold mb-1">Vorherige Betriebsstunden</h2>
        <p className="text-xs text-[#888] mb-3">
          Stunden, die das Motorrad vor dem ESP32-Einbau hatte. Die App zeigt dann{' '}
          <span className="text-white">Offset + ESP-Stunden</span> als Gesamtstunden an.
        </p>
        <form action={updateOffsetWithId} className="flex gap-2">
          <input
            name="hours_offset"
            type="number"
            min="0"
            step="0.01"
            defaultValue={bike.hours_offset ?? 0}
            required
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="bg-[#ff6600] text-black font-semibold rounded-lg px-4 text-sm"
          >
            Speichern
          </button>
        </form>
      </section>

      {/* Service Intervals */}
      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">Service Intervalle</h2>

        {(intervals ?? []).length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {(intervals ?? []).map((interval) => {
              const deleteWithIds = deleteInterval.bind(null, interval.id, id)
              return (
                <div
                  key={interval.id}
                  className="bg-[#1a1a1a] rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{interval.name}</p>
                    <p className="text-[#888] text-xs">alle {interval.interval_hours}h</p>
                  </div>
                  <form action={deleteWithIds}>
                    <button
                      type="submit"
                      className="text-red-400 text-xs border border-red-900 rounded px-2 py-1"
                    >
                      Löschen
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}

        <form action={addIntervalWithId} className="flex flex-col gap-2">
          <input
            name="name"
            type="text"
            placeholder="Name (z.B. Ölwechsel)"
            required
            className={`${inputClass} w-full`}
          />
          <div className="flex gap-2">
            <input
              name="interval_hours"
              type="number"
              placeholder="Intervall (Stunden)"
              required
              min="1"
              step="0.01"
              className={`${inputClass} flex-1`}
            />
          </div>
          <input
            name="last_service_hours"
            type="number"
            placeholder="Letzter Service bei … h (optional)"
            min="0"
            step="0.01"
            className={`${inputClass} w-full`}
          />
          <p className="text-xs text-[#555]">Leer lassen = Tracking startet ab jetzt</p>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#ff6600] text-black font-semibold rounded-lg px-4 text-sm"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </section>

      {/* Delete Bike */}
      <section>
        <h2 className="text-base font-semibold mb-3 text-red-400">Bike löschen</h2>
        <form action={deleteBikeWithId}>
          <button
            type="submit"
            className="w-full border border-red-800 text-red-400 rounded-lg py-3 text-sm"
          >
            Bike permanent löschen
          </button>
        </form>
      </section>
    </main>
  )
}
