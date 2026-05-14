import Link from 'next/link'
import ServiceBadge from './ServiceBadge'

interface BikeCardProps {
  id: string
  name: string
  make: string | null
  model: string | null
  totalHours: number
  worstStatus: 'ok' | 'soon' | 'overdue'
  nextServiceName?: string
}

export default function BikeCard({
  id,
  name,
  make,
  model,
  totalHours,
  worstStatus,
  nextServiceName,
}: BikeCardProps) {
  const borderColor = {
    ok: 'border-green-800',
    soon: 'border-orange-700',
    overdue: 'border-red-800',
  }[worstStatus]

  return (
    <Link href={`/bikes/${id}`}>
      <div className={`bg-[#1a1a1a] border-l-4 ${borderColor} rounded-lg p-4 flex flex-col gap-2`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white text-base leading-tight">{name}</h2>
            {(make || model) && (
              <p className="text-[#888] text-xs mt-0.5">
                {[make, model].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
          <ServiceBadge status={worstStatus} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</span>
          <span className="text-[#888] text-sm">Stunden</span>
        </div>
        {nextServiceName && (
          <p className="text-xs text-[#888]">
            Nächster Service: <span className="text-white">{nextServiceName}</span>
          </p>
        )}
      </div>
    </Link>
  )
}
