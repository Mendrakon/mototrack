import type { ServiceStatus } from '@/lib/calculations'

interface ServiceIntervalCardProps {
  status: ServiceStatus
}

export default function ServiceIntervalCard({ status }: ServiceIntervalCardProps) {
  const clampedPct = Math.min(status.percentageDue, 100)
  const barColor =
    status.status === 'overdue'
      ? 'bg-red-600'
      : status.status === 'soon'
      ? 'bg-orange-500'
      : 'bg-green-600'
  const labelColor =
    status.status === 'overdue'
      ? 'text-red-400'
      : status.status === 'soon'
      ? 'text-orange-400'
      : 'text-green-400'

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-white text-sm">{status.name}</span>
        <span className={`text-xs font-semibold ${labelColor}`}>
          {status.status === 'overdue'
            ? `${status.hoursOverdue.toFixed(1)}h überfällig`
            : status.status === 'soon'
            ? `${status.hoursUntilNext.toFixed(1)}h verbleibend`
            : `${status.hoursUntilNext.toFixed(1)}h verbleibend`}
        </span>
      </div>
      <div className="w-full bg-[#333] rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      <p className="text-xs text-[#666]">
        Alle {status.intervalHours}h · {Math.round(status.percentageDue)}% genutzt
      </p>
    </div>
  )
}
