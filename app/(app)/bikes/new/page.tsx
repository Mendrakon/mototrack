import { createBike } from './actions'

const inputClass =
  'bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600] w-full'

export default async function NewBikePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className="p-4">
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
