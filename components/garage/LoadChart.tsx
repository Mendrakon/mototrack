interface LoadChartProps {
  fullThrottle: number
  partialThrottle: number
  idle: number
}

interface BarProps {
  label: string
  pct: number
  color: string
}

function Bar({ label, pct, color }: BarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#666] text-sm w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-[#222] rounded-full h-5 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all flex items-center justify-end pr-2`}
          style={{ width: `${pct}%` }}
        >
          {pct >= 15 && (
            <span className="text-white text-xs font-semibold">{pct}%</span>
          )}
        </div>
      </div>
      {pct < 15 && <span className="text-[#666] text-xs w-8">{pct}%</span>}
    </div>
  )
}

export default function LoadChart({ fullThrottle, partialThrottle, idle }: LoadChartProps) {
  return (
    <div className="bg-[#111] rounded-xl p-5 flex flex-col gap-4 flex-1">
      <div className="flex items-center justify-between">
        <p className="text-[#555] text-sm font-medium uppercase tracking-wider">Lastkollektiv</p>
        <span className="text-[10px] text-[#444] uppercase tracking-widest">mock</span>
      </div>

      <div className="flex flex-col gap-3 justify-center flex-1">
        <Bar label="Vollgas" pct={fullThrottle} color="bg-[#FF6600]" />
        <Bar label="Teillast" pct={partialThrottle} color="bg-orange-700" />
        <Bar label="Leerlauf" pct={idle} color="bg-[#333]" />
      </div>
    </div>
  )
}
