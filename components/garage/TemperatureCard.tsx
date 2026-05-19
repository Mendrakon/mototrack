interface TemperatureCardProps {
  currentTemp: number
  maxTemp: number
  avgTemp: number
}

function tempColor(temp: number): string {
  if (temp < 60) return 'text-blue-400'
  if (temp < 90) return 'text-green-400'
  if (temp <= 100) return 'text-orange-400'
  return 'text-red-500'
}

function tempBarColor(temp: number): string {
  if (temp < 60) return 'bg-blue-500'
  if (temp < 90) return 'bg-green-500'
  if (temp <= 100) return 'bg-orange-500'
  return 'bg-red-600'
}

export default function TemperatureCard({ currentTemp, maxTemp, avgTemp }: TemperatureCardProps) {
  // Gauge: 0°C = 0%, 120°C = 100%
  const gaugePct = Math.min((currentTemp / 120) * 100, 100)
  const optimalMinPct = (70 / 120) * 100
  const optimalMaxPct = (90 / 120) * 100

  return (
    <div className="bg-[#111] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[#555] text-sm font-medium uppercase tracking-wider">Kühlwasser Temperatur</p>
        <span className="text-[10px] text-[#444] uppercase tracking-widest">mock</span>
      </div>

      <div className="flex items-end gap-4">
        <span className={`text-7xl font-bold leading-none ${tempColor(currentTemp)}`}>
          {currentTemp.toFixed(0)}°
        </span>
        <div className="flex flex-col gap-1 pb-1 text-sm text-[#666]">
          <span>Max <span className="text-[#888]">{maxTemp.toFixed(0)}°</span></span>
          <span>Ø <span className="text-[#888]">{avgTemp.toFixed(0)}°</span></span>
        </div>
      </div>

      {/* Gauge Bar */}
      <div className="relative w-full h-3 bg-[#222] rounded-full overflow-hidden">
        {/* Optimal range highlight */}
        <div
          className="absolute top-0 h-full bg-green-900/40 rounded-full"
          style={{ left: `${optimalMinPct}%`, width: `${optimalMaxPct - optimalMinPct}%` }}
        />
        {/* Current temp indicator */}
        <div
          className={`absolute top-0 left-0 h-full ${tempBarColor(currentTemp)} rounded-full transition-all`}
          style={{ width: `${gaugePct}%` }}
        />
      </div>
      <p className="text-[#444] text-xs -mt-2">Optimal: 70–90°C</p>
    </div>
  )
}
