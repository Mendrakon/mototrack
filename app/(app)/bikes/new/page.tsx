import { createBike } from './actions'
import BackButton from '@/components/BackButton'

const inputClass =
  'bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#ff6600] w-full'

export default async function NewBikePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className="p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Neues Bike</h1>
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
          Fehler: {decodeURIComponent(error)}
        </div>
      )}
      <form action={createBike} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Name *</label>
          <input
            name="name"
            type="text"
            placeholder="z.B. KTM 350 EXC-F"
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Marke</label>
          <input
            name="make"
            type="text"
            placeholder="z.B. KTM"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Modell</label>
          <input
            name="model"
            type="text"
            placeholder="z.B. 350 EXC-F"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Baujahr</label>
          <input
            name="year"
            type="number"
            placeholder="z.B. 2023"
            min="1900"
            max="2100"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888]">Vorherige Betriebsstunden</label>
          <input
            name="hours_offset"
            type="number"
            placeholder="z.B. 400 (bei Gebrauchtmotorrad)"
            min="0"
            step="0.5"
            defaultValue="0"
            className={inputClass}
          />
          <p className="text-xs text-[#555]">Stunden, die das Motorrad vor dem ESP32-Einbau hatte</p>
        </div>
        <button
          type="submit"
          className="bg-[#ff6600] text-black font-semibold rounded-lg py-3 text-sm mt-2"
        >
          Bike anlegen
        </button>
      </form>
    </main>
  )
}
