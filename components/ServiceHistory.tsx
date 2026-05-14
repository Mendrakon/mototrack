import type { ServiceLog } from '@/lib/types'

interface ServiceHistoryProps {
  logs: ServiceLog[]
}

export default function ServiceHistory({ logs }: ServiceHistoryProps) {
  if (logs.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold mb-3 text-white">Service Historie</h2>
      <div className="flex flex-col gap-2">
        {logs.map((log) => (
          <div key={log.id} className="bg-[#1a1a1a] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">{log.service_name}</p>
              <p className="text-[#888] text-xs">
                {new Date(log.date).toLocaleDateString('de-AT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>
            </div>
            <p className="text-[#666] text-xs mt-0.5">
              bei {Number(log.hours_at_service).toFixed(2)}h
            </p>
            {log.notes && (
              <p className="text-[#888] text-xs mt-1 italic">{log.notes}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
