import type { ServiceStatus } from '@/lib/calculations'

interface Props {
  statuses: ServiceStatus[]
}

export default function GarageServiceStatus({ statuses }: Props) {
  return (
    <div className="bg-[#111] rounded-xl p-5 flex flex-col gap-4 flex-1 min-h-0">
      <p className="text-[#555] text-sm font-medium uppercase tracking-wider shrink-0">Service Intervalle</p>

      {statuses.length === 0 ? (
        <p className="text-[#444] text-sm">Keine Intervalle konfiguriert</p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          {statuses.map((s) => {
            const clampedPct = Math.min(s.percentageDue, 100)
            const barColor =
              s.status === 'overdue' ? 'bg-red-600' :
              s.status === 'soon' ? 'bg-orange-500' : 'bg-green-600'
            const labelColor =
              s.status === 'overdue' ? 'text-red-400' :
              s.status === 'soon' ? 'text-orange-400' : 'text-green-500'

            return (
              <div key={s.intervalId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white text-base font-medium">{s.name}</span>
                  <span className={`text-sm font-semibold ${labelColor}`}>
                    {s.status === 'overdue'
                      ? `${s.hoursOverdue.toFixed(1)}h überfällig`
                      : `${s.hoursUntilNext.toFixed(1)}h verbleibend`}
                  </span>
                </div>
                <div className="w-full bg-[#222] rounded-full h-2.5">
                  <div
                    className={`${barColor} h-2.5 rounded-full transition-all`}
                    style={{ width: `${clampedPct}%` }}
                  />
                </div>
                <p className="text-[#555] text-xs">
                  Alle {s.intervalHours}h · {Math.round(s.percentageDue)}% genutzt
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
