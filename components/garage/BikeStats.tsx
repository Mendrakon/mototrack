interface StatCardProps {
  label: string
  value: string
  unit: string
  isMock?: boolean
}

function StatCard({ label, value, unit, isMock }: StatCardProps) {
  return (
    <div className="bg-[#111] rounded-xl p-4 flex flex-col justify-between">
      <p className="text-[#555] text-sm font-medium uppercase tracking-wider">{label}</p>
      <div className="mt-2">
        <span className="text-5xl font-bold text-white">{value}</span>
        <span className="text-[#666] text-lg ml-1.5">{unit}</span>
        {isMock && <span className="ml-2 text-[10px] text-[#444] uppercase tracking-widest">mock</span>}
      </div>
    </div>
  )
}

interface BikeStatsProps {
  totalHours: number
  maxTemp: number
  totalDistanceKm: number
  totalFuelL: number
}

export default function BikeStats({ totalHours, maxTemp, totalDistanceKm, totalFuelL }: BikeStatsProps) {
  const avgConsumption = totalDistanceKm > 0
    ? ((totalFuelL / totalDistanceKm) * 100).toFixed(1)
    : '—'

  return (
    <>
      <StatCard label="Betriebsstunden" value={totalHours.toFixed(2)} unit="h" />
      <StatCard label="Max Temperatur" value={`${maxTemp.toFixed(0)}°`} unit="C" isMock />
      <StatCard label="Gesamtstrecke" value={totalDistanceKm.toFixed(0)} unit="km" isMock />
      <StatCard label="Verbrauch ø" value={avgConsumption} unit="L/100km" isMock />
    </>
  )
}
